import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";
import type { CalendarSyncStateRepository } from "../../calendar/repositories/CalendarSyncStateRepository.js";

export interface CalendarSyncStatus {
  connected: boolean;
  lastSyncedAt: string | null;
}

export class GetCalendarSyncStatusService {
  constructor(
    private readonly oauthAccounts: OAuthAccountRepository,
    private readonly syncStates: CalendarSyncStateRepository,
  ) {}

  async execute(userId: string): Promise<CalendarSyncStatus> {
    const account = await this.oauthAccounts.findByUser(
      userId,
      OAuthProvider.GOOGLE,
    );
    const state = await this.syncStates.findByUser(userId);

    return {
      connected: Boolean(account),
      lastSyncedAt: state?.lastSyncedAt?.toISOString() ?? null,
    };
  }
}
