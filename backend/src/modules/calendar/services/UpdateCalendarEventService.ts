import { AppError } from "../../../shared/appError.js";
import { fromIsoDate } from "../../../shared/dates.js";
import {
  toCalendarEventDto,
  type CalendarEventDto,
} from "../../../shared/presenters.js";
import type {
  CalendarEventRepository,
  UpdateCalendarEventData,
} from "../repositories/CalendarEventRepository.js";
import type { UpdateCalendarEventInput } from "../validation/calendar.schema.js";

export class UpdateCalendarEventService {
  constructor(private readonly events: CalendarEventRepository) {}

  async execute(
    userId: string,
    eventId: string,
    input: UpdateCalendarEventInput,
  ): Promise<CalendarEventDto> {
    const data: UpdateCalendarEventData = {};

    if (input.type !== undefined) {
      data.type = input.type;
    }

    if (input.title !== undefined) {
      data.title = input.title;
    }

    if (input.date !== undefined) {
      data.date = fromIsoDate(input.date);
    }

    if (input.startTime !== undefined) {
      data.startTime = input.startTime;
    }

    if (input.notes !== undefined) {
      data.notes = input.notes;
    }

    const event = await this.events.update(eventId, userId, data);

    if (!event) {
      throw new AppError("Calendar event not found", 404);
    }

    return toCalendarEventDto(event);
  }
}
