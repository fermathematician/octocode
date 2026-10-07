import type {
  CalendarEvent,
  CalendarEventType,
} from "../domain/types";
import { apiFetch, type Paginated } from "./http";

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
  completed?: boolean;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const page = await apiFetch<Paginated<CalendarEvent>>("/calendar-events");
  return page.items;
}

export function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  return apiFetch<CalendarEvent>("/calendar-events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCalendarEvent(
  eventId: string,
  input: UpdateCalendarEventInput,
): Promise<CalendarEvent> {
  return apiFetch<CalendarEvent>(`/calendar-events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCalendarEvent(eventId: string): Promise<void> {
  return apiFetch<void>(`/calendar-events/${eventId}`, { method: "DELETE" });
}
