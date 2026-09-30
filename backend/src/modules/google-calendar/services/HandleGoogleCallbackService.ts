import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type { GoogleCalendarClient } from "../../../infrastructure/google/GoogleCalendarClient.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";

export interface HandleGoogleCallbackInput {
  userId: string;
  code: string;
}

export class HandleGoogleCallbackService {
  constructor(
    private readonly googleClient: GoogleCalendarClient,
    private readonly tokenCipher: TokenCipher,
    private readonly oauthAccounts: OAuthAccountRepository,
  ) {}

  async execute(input: HandleGoogleCallbackInput): Promise<void> {
    const token = await this.googleClient.exchangeCodeForToken(input.code);

    await this.oauthAccounts.save({
      userId: input.userId,
      provider: OAuthProvider.GOOGLE,
      // Google is linked to the Octocode user; the external Google account id is
      // not needed for calendar access, so the user id keys the record.
      providerAccountId: input.userId,
      accessToken: this.tokenCipher.encrypt(token.accessToken),
      refreshToken: token.refreshToken
        ? this.tokenCipher.encrypt(token.refreshToken)
        : null,
      tokenType: token.tokenType,
      scope: token.scope,
      expiresAt: token.expiresAt,
    });
  }
}
