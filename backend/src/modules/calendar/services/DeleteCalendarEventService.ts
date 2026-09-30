import type { GoogleCalendarClient } from "../../../infrastructure/google/GoogleCalendarClient.js";
import type { GoogleTokenProvider } from "../../../infrastructure/google/GoogleTokenProvider.js";
import type { CalendarEventRepository } from "../repositories/CalendarEventRepository.js";
import type { CalendarSyncStateRepository } from "../repositories/CalendarSyncStateRepository.js";

export class DeleteCalendarEventService {
  constructor(
    private readonly events: CalendarEventRepository,
    private readonly googleClient: GoogleCalendarClient,
    private readonly tokenProvider: GoogleTokenProvider,
    private readonly syncStates: CalendarSyncStateRepository,
  ) {}

  async execute(userId: string, eventId: string): Promise<void> {
    const event = await this.events.findByIdForUser(eventId, userId);

    if (event?.externalId) {
      await this.deleteRemote(userId, event.externalId);
    }

    await this.events.delete(eventId, userId);
  }

  private async deleteRemote(
    userId: string,
    externalId: string,
  ): Promise<void> {
    try {
      const accessToken = await this.tokenProvider.getAccessToken(userId);
      const state = await this.syncStates.findByUser(userId);

      await this.googleClient.deleteEvent(
        accessToken,
        state?.calendarId ?? "primary",
        externalId,
      );
    } catch {
      // Best effort: never block the local delete because of Google.
    }
  }
}
