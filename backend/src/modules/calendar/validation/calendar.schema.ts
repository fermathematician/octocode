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
import {
  parsePagination,
  type Pagination,
} from "../../../shared/pagination.js";

const TYPE_BY_NAME: Record<string, CalendarEventType> = {
  reminder: CalendarEventType.REMINDER,
  task: CalendarEventType.TASK,
  meeting: CalendarEventType.MEETING,
};

const TYPE_NAMES = ["reminder", "task", "meeting"] as const;

export interface CreateCalendarEventInput {
  type: CalendarEventType;
  title: string;
  date: string;
  startTime: string;
}

export interface UpdateCalendarEventInput {
  type?: CalendarEventType;
  title?: string;
  date?: string;
  startTime?: string;
  notes?: string;
}

export interface ListCalendarEventsQuery {
  date?: string;
  pagination: Pagination;
}

export function parseCreateCalendarEventBody(
  value: unknown,
): CreateCalendarEventInput {
  const record = asObject(value);
  const typeName = requireEnum(record, "type", TYPE_NAMES);

  return {
    type: TYPE_BY_NAME[typeName] as CalendarEventType,
    title: requireString(record, "title", { maxLength: 200 }).trim(),
    date: requireIsoDate(record, "date"),
    startTime: requireTime(record, "startTime"),
  };
}

export function parseUpdateCalendarEventBody(
  value: unknown,
): UpdateCalendarEventInput {
  const record = asObject(value);
  const input: UpdateCalendarEventInput = {};

  if (record.type !== undefined) {
    const typeName = requireEnum(record, "type", TYPE_NAMES);
    input.type = TYPE_BY_NAME[typeName] as CalendarEventType;
  }

  if (record.title !== undefined) {
    input.title = requireString(record, "title", { maxLength: 200 }).trim();
  }

  if (record.date !== undefined) {
    input.date = requireIsoDate(record, "date");
  }

  if (record.startTime !== undefined) {
    input.startTime = requireTime(record, "startTime");
  }

  if (record.notes !== undefined) {
    input.notes = optionalString(record, "notes") ?? "";
  }

  if (Object.keys(input).length === 0) {
    throw new ValidationError("Provide at least one field to update.");
  }

  return input;
}

export function parseListCalendarEventsQuery(
  value: unknown,
): ListCalendarEventsQuery {
  const record = asObject(value);
  const date = optionalString(record, "date");

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ValidationError("date must be a YYYY-MM-DD date.");
  }

  return {
    ...(date ? { date } : {}),
    pagination: parsePagination(record),
  };
}

export function parseCalendarEventParams(value: unknown): { eventId: string } {
  return { eventId: requireString(asObject(value), "eventId") };
}
