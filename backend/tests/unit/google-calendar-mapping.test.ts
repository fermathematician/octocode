import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CalendarEventSource,
  CalendarEventType,
} from "../../src/generated/prisma/client.js";
import {
  parseGoogleDateTime,
  toCalendarEventMapping,
  toGoogleEventInput,
} from "../../src/modules/google-calendar/mapping.js";

describe("parseGoogleDateTime", () => {
  it("extracts the wall-clock date and time", () => {
    assert.deepEqual(parseGoogleDateTime("2026-09-30T14:05:00-03:00"), {
      date: "2026-09-30",
      time: "14:05",
    });
  });

  it("returns null for a non-datetime", () => {
    assert.equal(parseGoogleDateTime("nope"), null);
  });
});

describe("toCalendarEventMapping", () => {
  it("maps a timed event with attendees to a meeting", () => {
    const mapping = toCalendarEventMapping({
      id: "g1",
      status: "confirmed",
      summary: "Standup",
      description: "notes",
      start: { dateTime: "2026-09-30T09:30:00Z" },
      end: {},
      attendees: [{}, {}],
      updated: "2026-09-29T10:00:00Z",
    });

    assert.ok(mapping);
    assert.equal(mapping.type, "MEETING");
    assert.equal(mapping.title, "Standup");
    assert.equal(mapping.startTime, "09:30");
    assert.equal(mapping.notes, "notes");
    assert.equal(
      mapping.externalUpdatedAt?.toISOString(),
      "2026-09-29T10:00:00.000Z",
    );
  });

  it("defaults to a task without attendees", () => {
    const mapping = toCalendarEventMapping({
      id: "g2",
      status: "confirmed",
      summary: "Write docs",
      start: { dateTime: "2026-09-30T10:00:00Z" },
      end: {},
    });

    assert.equal(mapping?.type, "TASK");
  });

  it("honors the octocodeType property", () => {
    const mapping = toCalendarEventMapping({
      id: "g3",
      status: "confirmed",
      summary: "Pay rent",
      start: { dateTime: "2026-09-30T10:00:00Z" },
      end: {},
      extendedProperties: { private: { octocodeType: "REMINDER" } },
    });

    assert.equal(mapping?.type, "REMINDER");
  });

  it("skips all-day events", () => {
    assert.equal(
      toCalendarEventMapping({
        id: "g4",
        status: "confirmed",
        start: { date: "2026-09-30" },
        end: {},
      }),
      null,
    );
  });
});

describe("toGoogleEventInput", () => {
  it("builds a one-hour event body", () => {
    const now = new Date("2026-09-30T00:00:00.000Z");
    const input = toGoogleEventInput(
      {
        id: "e1",
        userId: "u1",
        type: CalendarEventType.MEETING,
        title: "Standup",
        date: now,
        startTime: "09:30",
        notes: "hi",
        completed: false,
        source: CalendarEventSource.LOCAL,
        externalId: null,
        externalUpdatedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      "UTC",
    );

    assert.equal(input.summary, "Standup");
    assert.equal(input.start.dateTime, "2026-09-30T09:30:00");
    assert.equal(input.end.dateTime, "2026-09-30T10:30:00");
    assert.equal(input.privateProperties.octocodeType, "MEETING");
  });
});
