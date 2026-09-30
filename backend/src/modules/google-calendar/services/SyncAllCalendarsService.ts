import type { CalendarSyncStateRepository } from "../../calendar/repositories/CalendarSyncStateRepository.js";
import type { SyncCalendarService } from "./SyncCalendarService.js";

export class SyncAllCalendarsService {
  constructor(
    private readonly syncStates: CalendarSyncStateRepository,
    private readonly syncCalendar: SyncCalendarService,
  ) {}

  async execute(): Promise<void> {
    const userIds = await this.syncStates.listUserIds();

    for (const userId of userIds) {
      try {
        await this.syncCalendar.execute(userId);
      } catch (error) {
        // One user's failure must not stop the others.
        console.error("Google Calendar sync failed.", { userId, error });
      }
    }
  }
}
