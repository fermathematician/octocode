import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  GoogleCalendarClient,
  GoogleCalendarEvent,
} from "../../src/infrastructure/google/GoogleCalendarClient.js";
import type { GoogleTokenProvider } from "../../src/infrastructure/google/GoogleTokenProvider.js";
import { SyncCalendarService } from "../../src/modules/google-calendar/services/SyncCalendarService.js";
import {
  InMemoryCalendarEventRepository,
  InMemoryCalendarSyncStateRepository,
  InMemoryStore,
} from "../support/fakes.js";

function setup(remoteEvents: GoogleCalendarEvent[]) {
  const store = new InMemoryStore();
  const events = new InMemoryCalendarEventRepository(store);
  const syncStates = new InMemoryCalendarSyncStateRepository();
  const created: string[] = [];

  const googleClient = {
    listEvents: async () => ({ events: remoteEvents, nextSyncToken: "token-1" }),
    createEvent: async (
      _token: string,
      _calendarId: string,
      input: { summary: string },
    ) => {
      const id = `created-${created.length + 1}`;
      created.push(input.summary);
      return {
        id,
        status: "confirmed",
        updated: new Date().toISOString(),
        start: {},
        end: {},
      } as unknown as GoogleCalendarEvent;
    },
    deleteEvent: async () => {},
  } as unknown as GoogleCalendarClient;

  const tokenProvider = {
    getAccessToken: async () => "token",
  } as unknown as GoogleTokenProvider;

  const service = new SyncCalendarService(
    events,
    syncStates,
    tokenProvider,
    googleClient,
    "UTC",
  );

  return { store, syncStates, service, created };
}

describe("SyncCalendarService", () => {
  it("pulls Google events and stores the sync token", async () => {
    const { store, syncStates, service } = setup([
      {
        id: "g1",
        status: "confirmed",
        summary: "Sync",
        start: { dateTime: "2026-09-30T09:00:00Z" },
        end: {},
        attendees: [],
      },
    ]);
    const user = store.seedUser();

    const result = await service.execute(user.id);

    assert.equal(result.pulled, 1);
    assert.equal(store.calendarEvents.length, 1);
    assert.equal(store.calendarEvents[0]?.source, "GOOGLE");
    assert.equal((await syncStates.findByUser(user.id))?.syncToken, "token-1");
  });

  it("deletes local events that Google reports as cancelled", async () => {
    const { store, service } = setup([
      { id: "g9", status: "cancelled", start: {}, end: {} },
    ]);
    const user = store.seedUser();
    store.seedCalendarEvent(user.id, {
      source: "GOOGLE",
      externalId: "g9",
    });

    const result = await service.execute(user.id);

    assert.equal(result.deleted, 1);
    assert.equal(store.calendarEvents.length, 0);
  });

  it("pushes local events that were never synced", async () => {
    const { store, service, created } = setup([]);
    const user = store.seedUser();
    store.seedCalendarEvent(user.id, { title: "Local task", externalId: null });

    const result = await service.execute(user.id);

    assert.equal(result.pushed, 1);
    assert.deepEqual(created, ["Local task"]);
    assert.equal(store.calendarEvents[0]?.externalId, "created-1");
  });

  it("does not overwrite locally-owned events on pull", async () => {
    const { store, service } = setup([
      {
        id: "g1",
        status: "confirmed",
        summary: "Remote title",
        start: { dateTime: "2026-09-30T09:00:00Z" },
        end: {},
      },
    ]);
    const user = store.seedUser();
    store.seedCalendarEvent(user.id, {
      title: "Local wins",
      source: "LOCAL",
      externalId: "g1",
    });

    await service.execute(user.id);

    assert.equal(store.calendarEvents[0]?.title, "Local wins");
  });
});
