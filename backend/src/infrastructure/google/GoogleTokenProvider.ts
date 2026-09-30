import { OAuthProvider } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/appError.js";
import type { OAuthAccountRepository } from "../../modules/auth/repositories/OAuthAccountRepository.js";
import type { TokenCipher } from "../auth/TokenCipher.js";
import type { GoogleCalendarClient } from "./GoogleCalendarClient.js";

const EXPIRY_SKEW_MS = 60_000;

/** Returns a valid Google access token, refreshing it when it is (nearly) expired. */
export class GoogleTokenProvider {
  constructor(
    private readonly oauthAccounts: OAuthAccountRepository,
    private readonly tokenCipher: TokenCipher,
    private readonly googleClient: GoogleCalendarClient,
  ) {}

  async getAccessToken(userId: string): Promise<string> {
    const account = await this.oauthAccounts.findByUser(
      userId,
      OAuthProvider.GOOGLE,
    );

    if (!account) {
      throw new AppError("Google Calendar is not connected.", 400);
    }

    const accessToken = this.tokenCipher.decrypt(account.accessToken);
    const expiresAt = account.expiresAt?.getTime() ?? 0;

    if (expiresAt - Date.now() > EXPIRY_SKEW_MS) {
      return accessToken;
    }

    if (!account.refreshToken) {
      throw new AppError(
        "Google Calendar connection expired. Please reconnect.",
        401,
      );
    }

    const refreshed = await this.googleClient.refreshAccessToken(
      this.tokenCipher.decrypt(account.refreshToken),
    );

    await this.oauthAccounts.updateTokens(account.id, {
      accessToken: this.tokenCipher.encrypt(refreshed.accessToken),
      refreshToken: refreshed.refreshToken
        ? this.tokenCipher.encrypt(refreshed.refreshToken)
        : account.refreshToken,
      tokenType: refreshed.tokenType,
      expiresAt: refreshed.expiresAt,
    });

    return refreshed.accessToken;
  }
}
