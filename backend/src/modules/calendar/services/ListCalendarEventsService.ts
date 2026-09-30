import { fromIsoDate } from "../../../shared/dates.js";
import {
  toCalendarEventDto,
  type CalendarEventDto,
} from "../../../shared/presenters.js";
import type { CalendarEventRepository } from "../repositories/CalendarEventRepository.js";

export class ListCalendarEventsService {
  constructor(private readonly events: CalendarEventRepository) {}

  async execute(userId: string, date?: string): Promise<CalendarEventDto[]> {
    const events = await this.events.findManyByUser(
      userId,
      date ? fromIsoDate(date) : undefined,
    );

    return events.map(toCalendarEventDto);
  }
}
