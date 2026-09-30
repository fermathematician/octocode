import { CalendarEventType } from "../../../generated/prisma/client.js";
import {
  ValidationError,
  asObject,
  optionalString,
  requireEnum,
  requireIsoDate,
  requireString,
  requireTime,
} from "../../../shared/validation.js";

const TYPE_BY_NAME: Record<string, CalendarEventType> = {
  reminder: CalendarEventType.REMINDER,
  task: CalendarEventType.TASK,
  meeting: CalendarEventType.MEETING,
};

export interface CreateCalendarEventInput {
  type: CalendarEventType;
  title: string;
  date: string;
  startTime: string;
}

export function parseCreateCalendarEventBody(
  value: unknown,
): CreateCalendarEventInput {
  const record = asObject(value);
  const typeName = requireEnum(record, "type", [
    "reminder",
    "task",
    "meeting",
  ]);

  return {
    type: TYPE_BY_NAME[typeName] as CalendarEventType,
    title: requireString(record, "title", { maxLength: 200 }).trim(),
    date: requireIsoDate(record, "date"),
    startTime: requireTime(record, "startTime"),
  };
}

export function parseListCalendarEventsQuery(
  value: unknown,
): { date?: string } {
  const record = asObject(value);
  const date = optionalString(record, "date");

  if (!date) {
    return {};
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ValidationError("date must be a YYYY-MM-DD date.");
  }

  return { date };
}

export function parseCalendarEventParams(value: unknown): { eventId: string } {
  return { eventId: requireString(asObject(value), "eventId") };
}
