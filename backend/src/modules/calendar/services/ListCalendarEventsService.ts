import { fromIsoDate } from "../../../shared/dates.js";
import {
  type Paginated,
  type Pagination,
} from "../../../shared/pagination.js";
import {
  toCalendarEventDto,
  type CalendarEventDto,
} from "../../../shared/presenters.js";
import type { CalendarEventRepository } from "../repositories/CalendarEventRepository.js";

export class ListCalendarEventsService {
  constructor(private readonly events: CalendarEventRepository) {}

  async execute(
    userId: string,
    date: string | undefined,
    pagination: Pagination,
  ): Promise<Paginated<CalendarEventDto>> {
    const page = await this.events.findManyByUser(
      userId,
      date ? fromIsoDate(date) : undefined,
      pagination,
    );

    return {
      items: page.items.map(toCalendarEventDto),
      nextCursor: page.nextCursor,
    };
  }
}
