import type {
  CalendarEvent,
  CalendarEventType,
  PrismaClient,
} from "../../../generated/prisma/client.js";
import {
  buildPage,
  type Paginated,
  type Pagination,
} from "../../../shared/pagination.js";

export interface CreateCalendarEventData {
  userId: string;
  type: CalendarEventType;
  title: string;
  date: Date;
  startTime: string;
}

export interface UpdateCalendarEventData {
  type?: CalendarEventType;
  title?: string;
  date?: Date;
  startTime?: string;
  notes?: string;
}

export interface CalendarEventRepository {
  findManyByUser(
    userId: string,
    date: Date | undefined,
    pagination: Pagination,
  ): Promise<Paginated<CalendarEvent>>;
  create(data: CreateCalendarEventData): Promise<CalendarEvent>;
  update(
    id: string,
    userId: string,
    data: UpdateCalendarEventData,
  ): Promise<CalendarEvent | null>;
  delete(id: string, userId: string): Promise<void>;
}

export class PrismaCalendarEventRepository implements CalendarEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByUser(
    userId: string,
    date: Date | undefined,
    pagination: Pagination,
  ): Promise<Paginated<CalendarEvent>> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: { userId, ...(date ? { date } : {}) },
      orderBy: [{ date: "asc" }, { startTime: "asc" }, { id: "asc" }],
      take: pagination.limit + 1,
      ...(pagination.cursor
        ? { cursor: { id: pagination.cursor }, skip: 1 }
        : {}),
    });

    return buildPage(rows, pagination.limit);
  }

  create(data: CreateCalendarEventData): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.create({ data });
  }

  async update(
    id: string,
    userId: string,
    data: UpdateCalendarEventData,
  ): Promise<CalendarEvent | null> {
    const result = await this.prisma.calendarEvent.updateMany({
      where: { id, userId },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.calendarEvent.findFirst({ where: { id, userId } });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.calendarEvent.deleteMany({ where: { id, userId } });
  }
}
