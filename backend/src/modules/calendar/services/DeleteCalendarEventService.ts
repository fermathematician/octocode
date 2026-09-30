import type { CalendarEventRepository } from "../repositories/CalendarEventRepository.js";

export class DeleteCalendarEventService {
  constructor(private readonly events: CalendarEventRepository) {}

  async execute(userId: string, eventId: string): Promise<void> {
    await this.events.delete(eventId, userId);
  }
}
