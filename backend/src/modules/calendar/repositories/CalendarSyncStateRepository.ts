import type {
  CalendarSyncState,
  PrismaClient,
} from "../../../generated/prisma/client.js";

export interface SaveCalendarSyncStateData {
  calendarId: string;
  syncToken: string | null;
  lastSyncedAt: Date;
}

export interface CalendarSyncStateRepository {
  findByUser(userId: string): Promise<CalendarSyncState | null>;
  save(
    userId: string,
    data: SaveCalendarSyncStateData,
  ): Promise<CalendarSyncState>;
  deleteByUser(userId: string): Promise<void>;
  listUserIds(): Promise<string[]>;
}

export class PrismaCalendarSyncStateRepository
  implements CalendarSyncStateRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  findByUser(userId: string): Promise<CalendarSyncState | null> {
    return this.prisma.calendarSyncState.findUnique({ where: { userId } });
  }

  save(
    userId: string,
    data: SaveCalendarSyncStateData,
  ): Promise<CalendarSyncState> {
    return this.prisma.calendarSyncState.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async deleteByUser(userId: string): Promise<void> {
    await this.prisma.calendarSyncState.deleteMany({ where: { userId } });
  }

  async listUserIds(): Promise<string[]> {
    const rows = await this.prisma.calendarSyncState.findMany({
      select: { userId: true },
    });

    return rows.map((row) => row.userId);
  }
}
