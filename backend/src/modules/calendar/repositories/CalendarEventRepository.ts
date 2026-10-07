import type {
  CalendarEvent,
  CalendarEventSource,
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
  completed?: boolean;
}

export interface UpsertExternalCalendarEventData {
  type: CalendarEventType;
  title: string;
  date: Date;
  startTime: string;
  notes: string;
  externalUpdatedAt: Date | null;
}

export interface CalendarEventRepository {
  findManyByUser(
    userId: string,
    date: Date | undefined,
    pagination: Pagination,
  ): Promise<Paginated<CalendarEvent>>;
  findByIdForUser(id: string, userId: string): Promise<CalendarEvent | null>;
  findByExternalId(
    userId: string,
    externalId: string,
  ): Promise<CalendarEvent | null>;
  findLocalWithoutExternalId(userId: string): Promise<CalendarEvent[]>;
  create(data: CreateCalendarEventData): Promise<CalendarEvent>;
  upsertByExternalId(
    userId: string,
    externalId: string,
    data: UpsertExternalCalendarEventData,
  ): Promise<CalendarEvent>;
  setExternalId(
    id: string,
    externalId: string,
    externalUpdatedAt: Date,
  ): Promise<CalendarEvent>;
  update(
    id: string,
    userId: string,
    data: UpdateCalendarEventData,
  ): Promise<CalendarEvent | null>;
  delete(id: string, userId: string): Promise<void>;
  deleteByExternalId(userId: string, externalId: string): Promise<void>;
  deleteBySource(userId: string, source: CalendarEventSource): Promise<void>;
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

  findByIdForUser(id: string, userId: string): Promise<CalendarEvent | null> {
    return this.prisma.calendarEvent.findFirst({ where: { id, userId } });
  }

  findByExternalId(
    userId: string,
    externalId: string,
  ): Promise<CalendarEvent | null> {
    return this.prisma.calendarEvent.findFirst({
      where: { userId, externalId },
    });
  }

  findLocalWithoutExternalId(userId: string): Promise<CalendarEvent[]> {
    return this.prisma.calendarEvent.findMany({
      where: { userId, source: "LOCAL", externalId: null },
      orderBy: { createdAt: "asc" },
    });
  }

  create(data: CreateCalendarEventData): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.create({ data });
  }

  upsertByExternalId(
    userId: string,
    externalId: string,
    data: UpsertExternalCalendarEventData,
  ): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.upsert({
      where: { userId_externalId: { userId, externalId } },
      create: { userId, externalId, source: "GOOGLE", ...data },
      update: {
        type: data.type,
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        notes: data.notes,
        externalUpdatedAt: data.externalUpdatedAt,
      },
    });
  }

  setExternalId(
    id: string,
    externalId: string,
    externalUpdatedAt: Date,
  ): Promise<CalendarEvent> {
    return this.prisma.calendarEvent.update({
      where: { id },
      data: { externalId, externalUpdatedAt },
    });
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

  async deleteByExternalId(userId: string, externalId: string): Promise<void> {
    await this.prisma.calendarEvent.deleteMany({
      where: { userId, externalId },
    });
  }

  async deleteBySource(
    userId: string,
    source: CalendarEventSource,
  ): Promise<void> {
    await this.prisma.calendarEvent.deleteMany({ where: { userId, source } });
  }
}
