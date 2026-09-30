import { GoogleSyncTokenExpiredError } from "../../../infrastructure/google/GoogleApiError.js";
import type { GoogleCalendarClient } from "../../../infrastructure/google/GoogleCalendarClient.js";
import type { GoogleTokenProvider } from "../../../infrastructure/google/GoogleTokenProvider.js";
import type { CalendarEventRepository } from "../../calendar/repositories/CalendarEventRepository.js";
import type { CalendarSyncStateRepository } from "../../calendar/repositories/CalendarSyncStateRepository.js";
import { toCalendarEventMapping, toGoogleEventInput } from "../mapping.js";

export interface SyncCalendarResult {
  pulled: number;
  pushed: number;
  deleted: number;
  lastSyncedAt: Date;
}

interface PullResult {
  pulled: number;
  deleted: number;
  nextSyncToken: string | null;
}

export class SyncCalendarService {
  constructor(
    private readonly events: CalendarEventRepository,
    private readonly syncStates: CalendarSyncStateRepository,
    private readonly tokenProvider: GoogleTokenProvider,
    private readonly googleClient: GoogleCalendarClient,
    private readonly timeZone: string,
  ) {}

  async execute(userId: string): Promise<SyncCalendarResult> {
    const state = await this.syncStates.findByUser(userId);
    const calendarId = state?.calendarId ?? "primary";
    const accessToken = await this.tokenProvider.getAccessToken(userId);

    const pushed = await this.push(userId, accessToken, calendarId);
    const pull = await this.pull(
      userId,
      accessToken,
      calendarId,
      state?.syncToken ?? null,
    );

    const lastSyncedAt = new Date();
    await this.syncStates.save(userId, {
      calendarId,
      syncToken: pull.nextSyncToken,
      lastSyncedAt,
    });

    return {
      pulled: pull.pulled,
      pushed,
      deleted: pull.deleted,
      lastSyncedAt,
    };
  }

  /** Push locally-created events that have never been sent to Google. */
  private async push(
    userId: string,
    accessToken: string,
    calendarId: string,
  ): Promise<number> {
    const localEvents = await this.events.findLocalWithoutExternalId(userId);
    let pushed = 0;

    for (const event of localEvents) {
      const created = await this.googleClient.createEvent(
        accessToken,
        calendarId,
        toGoogleEventInput(event, this.timeZone),
      );
      await this.events.setExternalId(
        event.id,
        created.id,
        created.updated ? new Date(created.updated) : new Date(),
      );
      pushed += 1;
    }

    return pushed;
  }

  /** Pull Google changes. Locally-owned events are never overwritten (local wins). */
  private async pull(
    userId: string,
    accessToken: string,
    calendarId: string,
    syncToken: string | null,
  ): Promise<PullResult> {
    let result;

    try {
      result = await this.googleClient.listEvents(
        accessToken,
        calendarId,
        syncToken,
      );
    } catch (error) {
      if (!(error instanceof GoogleSyncTokenExpiredError)) {
        throw error;
      }

      result = await this.googleClient.listEvents(accessToken, calendarId, null);
    }

    let pulled = 0;
    let deleted = 0;

    for (const event of result.events) {
      if (event.status === "cancelled") {
        await this.events.deleteByExternalId(userId, event.id);
        deleted += 1;
        continue;
      }

      const existing = await this.events.findByExternalId(userId, event.id);

      if (existing && existing.source === "LOCAL") {
        continue;
      }

      const mapping = toCalendarEventMapping(event);

      if (!mapping) {
        continue;
      }

      await this.events.upsertByExternalId(userId, event.id, mapping);
      pulled += 1;
    }

    return { pulled, deleted, nextSyncToken: result.nextSyncToken };
  }
}
