import type {
  CalendarEvent,
  CalendarEventType,
  PrismaClient,
} from "../../../generated/prisma/client.js";

export interface CreateCalendarEventData {
  userId: string;
  type: CalendarEventType;
  title: string;
  date: Date;
  startTime: string;
}

export interface CalendarEventRepository {
  findManyByUser(userId: string, date?: Date): Promise<CalendarEvent[]>;
  create(data: CreateCalendarEventData): Promise<CalendarEvent>;
  delete(id: string, userId: string): Promise<void>;
}

export class PrismaCalendarEventRepository implements CalendarEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyByUser(userId: string, date?: Date): Promise<CalendarEvent[]> {
    return this.prisma.calendarEvent.findMany({
      where: { userId, ...(date ? { date } : {}) },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  }

  create(data: CreateCalendarEventData): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.create({ data });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.calendarEvent.deleteMany({ where: { id, userId } });
  }
}
