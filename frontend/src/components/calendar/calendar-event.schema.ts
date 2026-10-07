import {
  CALENDAR_EVENT_TYPES,
  type CalendarEventType,
} from "../../domain/types";

export interface CalendarEventFormValues {
  type: CalendarEventType;
  title: string;
  date: string;
  startTime: string;
}

export interface CalendarEventFormErrors {
  title?: string;
  date?: string;
  startTime?: string;
}

export function validateCalendarEvent(
  values: CalendarEventFormValues,
): CalendarEventFormErrors {
  const errors: CalendarEventFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!values.date) {
    errors.date = "Pick a date.";
  }

  if (!values.startTime) {
    errors.startTime = "Pick a start time.";
  }

  return errors;
}

export function isCalendarEventType(
  value: string,
): value is CalendarEventType {
  return CALENDAR_EVENT_TYPES.some((type) => type === value);
}
