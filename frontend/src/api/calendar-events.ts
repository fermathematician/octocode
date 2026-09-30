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
