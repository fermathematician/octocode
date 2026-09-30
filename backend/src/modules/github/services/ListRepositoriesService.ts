import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";
import { AppError } from "../../../shared/appError.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";

export class ListRepositoriesService {
  constructor(
    private readonly oauthAccounts: OAuthAccountRepository,
    private readonly tokenCipher: TokenCipher,
    private readonly githubClient: GithubClient,
  ) {}

  async execute(userId: string) {
    const account = await this.oauthAccounts.findByUser(
      userId,
      OAuthProvider.GITHUB,
    );

    if (!account) {
      throw new AppError("GitHub account is not connected.", 400);
    }

    const accessToken = this.tokenCipher.decrypt(account.accessToken);

    return this.githubClient.listRepositories(accessToken);
  }
}
