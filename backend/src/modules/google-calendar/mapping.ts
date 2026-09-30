import type {
  CalendarEvent as CalendarEventModel,
  CalendarEventType,
} from "../../generated/prisma/client.js";
import type {
  GoogleCalendarEvent,
  GoogleEventInput,
} from "../../infrastructure/google/GoogleCalendarClient.js";
import { toIsoDate } from "../../shared/dates.js";

export interface CalendarEventMapping {
  type: CalendarEventType;
  title: string;
  date: Date;
  startTime: string;
  notes: string;
  externalUpdatedAt: Date | null;
}

const DEFAULT_DURATION_MINUTES = 60;
const ALL_MINUTES_IN_DAY = 24 * 60;

export function parseGoogleDateTime(
  value: string,
): { date: string; time: string } | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value);
  const date = match?.[1];
  const time = match?.[2];

  if (!date || !time) {
    return null;
  }

  return { date, time };
}

/** Maps a Google event to an Octocode calendar event. Returns null for all-day events. */
export function toCalendarEventMapping(
  event: GoogleCalendarEvent,
): CalendarEventMapping | null {
  const dateTime = event.start?.dateTime;

  if (!dateTime) {
    return null;
  }

  const parsed = parseGoogleDateTime(dateTime);

  if (!parsed) {
    return null;
  }

  return {
    type: resolveType(event),
    title: event.summary?.trim() || "(no title)",
    date: new Date(`${parsed.date}T00:00:00.000Z`),
    startTime: parsed.time,
    notes: event.description ?? "",
    externalUpdatedAt: event.updated ? new Date(event.updated) : null,
  };
}

function resolveType(event: GoogleCalendarEvent): CalendarEventType {
  const custom = event.extendedProperties?.private?.octocodeType;

  if (custom === "REMINDER" || custom === "TASK" || custom === "MEETING") {
    return custom;
  }

  return (event.attendees?.length ?? 0) > 0 ? "MEETING" : "TASK";
}

export function toGoogleEventInput(
  event: CalendarEventModel,
  timeZone: string,
): GoogleEventInput {
  const date = toIsoDate(event.date);

  return {
    summary: event.title,
    description: event.notes,
    start: { dateTime: `${date}T${event.startTime}:00`, timeZone },
    end: {
      dateTime: `${date}T${addMinutes(event.startTime, DEFAULT_DURATION_MINUTES)}:00`,
      timeZone,
    },
    privateProperties: { octocodeType: event.type },
  };
}

function addMinutes(time: string, minutes: number): string {
  const [hours = 0, mins = 0] = time.split(":").map(Number);
  const total = Math.min(hours * 60 + mins + minutes, ALL_MINUTES_IN_DAY - 1);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");

  return `${hh}:${mm}`;
}
