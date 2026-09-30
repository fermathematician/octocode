import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";
import type {
  GithubSignInResult,
  GithubSignInService,
} from "./GithubSignInService.js";

export interface HandleGithubCallbackInput {
  code: string;
  userAgent?: string;
  ipAddress?: string;
}

export type HandleGithubCallbackResult = GithubSignInResult;

export class HandleGithubCallbackService {
  constructor(
    private readonly githubClient: GithubClient,
    private readonly signIn: GithubSignInService,
  ) {}

  async execute(
    input: HandleGithubCallbackInput,
  ): Promise<HandleGithubCallbackResult> {
    const token = await this.githubClient.exchangeCodeForToken(input.code);

    return this.signIn.execute({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      scope: token.scope,
      tokenType: token.tokenType,
      expiresAt: token.expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });
  }
}
