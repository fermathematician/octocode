import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";
import type { CalendarEventRepository } from "../../calendar/repositories/CalendarEventRepository.js";
import type { CalendarSyncStateRepository } from "../../calendar/repositories/CalendarSyncStateRepository.js";

export class DisconnectGoogleService {
  constructor(
    private readonly oauthAccounts: OAuthAccountRepository,
    private readonly syncStates: CalendarSyncStateRepository,
    private readonly events: CalendarEventRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.oauthAccounts.deleteByUser(userId, OAuthProvider.GOOGLE);
    await this.syncStates.deleteByUser(userId);
    await this.events.deleteBySource(userId, "GOOGLE");
  }
}
