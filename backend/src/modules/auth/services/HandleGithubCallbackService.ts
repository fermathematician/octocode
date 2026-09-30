import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { SessionProvider } from "../../../infrastructure/auth/SessionProvider.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";
import { toUserDto, type UserDto } from "../../../shared/presenters.js";
import type { OAuthAccountRepository } from "../repositories/OAuthAccountRepository.js";
import type { UserRepository } from "../repositories/UserRepository.js";

export interface HandleGithubCallbackInput {
  code: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface HandleGithubCallbackResult {
  user: UserDto;
  sessionToken: string;
  expiresAt: Date;
}

export class HandleGithubCallbackService {
  constructor(
    private readonly githubClient: GithubClient,
    private readonly tokenCipher: TokenCipher,
    private readonly userRepository: UserRepository,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly sessions: SessionProvider,
  ) {}

  async execute(
    input: HandleGithubCallbackInput,
  ): Promise<HandleGithubCallbackResult> {
    const token = await this.githubClient.exchangeCodeForToken(input.code);
    const githubUser = await this.githubClient.getAuthenticatedUser(
      token.accessToken,
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
      accessToken: this.tokenCipher.encrypt(token.accessToken),
      refreshToken: token.refreshToken
        ? this.tokenCipher.encrypt(token.refreshToken)
        : null,
      tokenType: token.tokenType,
      scope: token.scope,
      expiresAt: token.expiresAt,
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
