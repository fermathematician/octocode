import type { CalendarEvent, CalendarEventType } from "../domain/types";
import { createId, db, delay } from "./db";

export interface CreateCalendarEventInput {
  type: CalendarEventType;
  title: string;
  date: string;
  startTime: string;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  await delay();
  return db.calendarEvents.map((event) => ({ ...event }));
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  await delay();

  const event: CalendarEvent = {
    id: createId("event"),
    type: input.type,
    title: input.title.trim(),
    date: input.date,
    startTime: input.startTime,
    notes: "",
  };

  db.calendarEvents.push(event);

  return { ...event };
}
