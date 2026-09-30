import { fromIsoDate } from "../../../shared/dates.js";
import {
  toCalendarEventDto,
  type CalendarEventDto,
} from "../../../shared/presenters.js";
import type { CalendarEventRepository } from "../repositories/CalendarEventRepository.js";
import type { CreateCalendarEventInput } from "../validation/calendar.schema.js";

export class CreateCalendarEventService {
  constructor(private readonly events: CalendarEventRepository) {}

  async execute(
    userId: string,
    input: CreateCalendarEventInput,
  ): Promise<CalendarEventDto> {
    const event = await this.events.create({
      userId,
      type: input.type,
      title: input.title,
      date: fromIsoDate(input.date),
      startTime: input.startTime,
    });

    return toCalendarEventDto(event);
  }
}
