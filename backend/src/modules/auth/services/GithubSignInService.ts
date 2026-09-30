import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { SessionProvider } from "../../../infrastructure/auth/SessionProvider.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";
import { toUserDto, type UserDto } from "../../../shared/presenters.js";
import type { OAuthAccountRepository } from "../repositories/OAuthAccountRepository.js";
import type { UserRepository } from "../repositories/UserRepository.js";

export interface GithubSignInInput {
  accessToken: string;
  refreshToken?: string | null;
  scope?: string;
  tokenType?: string | null;
  expiresAt?: Date | null;
  userAgent?: string;
  ipAddress?: string;
}

export interface GithubSignInResult {
  user: UserDto;
  sessionToken: string;
  expiresAt: Date;
}

/**
 * Establishes an Octocode session from a GitHub access token: upserts the user,
 * stores the token encrypted, and creates a server-side session. Shared by the
 * OAuth callback and the dev-only personal-access-token sign-in.
 */
export class GithubSignInService {
  constructor(
    private readonly githubClient: GithubClient,
    private readonly tokenCipher: TokenCipher,
    private readonly userRepository: UserRepository,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly sessions: SessionProvider,
  ) {}

  async execute(input: GithubSignInInput): Promise<GithubSignInResult> {
    const githubUser = await this.githubClient.getAuthenticatedUser(
      input.accessToken,
    );

    const existingAccount =
      await this.oauthAccountRepository.findByProviderAccount(
        OAuthProvider.GITHUB,
        githubUser.id,
      );

    const profile = {
      login: githubUser.login,
      name: githubUser.name,
      email: githubUser.email,
      avatarUrl: githubUser.avatarUrl,
    };

    const existingUser = existingAccount
      ? await this.userRepository.findById(existingAccount.userId)
      : await this.userRepository.findByLogin(githubUser.login);

    const user = existingUser
      ? await this.userRepository.updateProfile(existingUser.id, profile)
      : await this.userRepository.create(profile);

    await this.oauthAccountRepository.save({
      userId: user.id,
      provider: OAuthProvider.GITHUB,
      providerAccountId: githubUser.id,
      accessToken: this.tokenCipher.encrypt(input.accessToken),
      refreshToken: input.refreshToken
        ? this.tokenCipher.encrypt(input.refreshToken)
        : null,
      tokenType: input.tokenType ?? null,
      scope: input.scope ?? "",
      expiresAt: input.expiresAt ?? null,
    });

    const session = await this.sessions.create(user.id, {
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    return {
      user: toUserDto(user),
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    };
  }
}
