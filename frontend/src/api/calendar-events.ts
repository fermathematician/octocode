import type {
  CalendarEvent,
  CalendarEventType,
} from "../domain/types";
import { apiFetch } from "./http";

export interface CreateCalendarEventInput {
  type: CalendarEventType;
  title: string;
  date: string;
  startTime: string;
}

export function getCalendarEvents(): Promise<CalendarEvent[]> {
  return apiFetch<CalendarEvent[]>("/calendar-events");
}

export function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  return apiFetch<CalendarEvent>("/calendar-events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
