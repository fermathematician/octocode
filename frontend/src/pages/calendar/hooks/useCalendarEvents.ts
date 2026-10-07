import { useCallback, useEffect, useState } from "react";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  type CreateCalendarEventInput,
  type UpdateCalendarEventInput,
} from "../../../api/calendar-events";
import type { CalendarEvent } from "../../../domain/types";

interface UseCalendarEventsResult {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  addEvent: (input: CreateCalendarEventInput) => Promise<void>;
  updateEvent: (
    eventId: string,
    input: UpdateCalendarEventInput,
  ) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
  toggleCompleted: (event: CalendarEvent) => Promise<void>;
  reload: () => void;
}

export function useCalendarEvents(): UseCalendarEventsResult {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const loaded = await getCalendarEvents();
        if (!cancelled) {
          setEvents(loaded);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load calendar events.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const addEvent = useCallback(
    async (input: CreateCalendarEventInput) => {
      await createCalendarEvent(input);
      reload();
    },
    [reload],
  );

  const updateEvent = useCallback(
    async (eventId: string, input: UpdateCalendarEventInput) => {
      await updateCalendarEvent(eventId, input);
      reload();
    },
    [reload],
  );

  const removeEvent = useCallback(
    async (eventId: string) => {
      await deleteCalendarEvent(eventId);
      reload();
    },
    [reload],
  );

  const toggleCompleted = useCallback(
    async (event: CalendarEvent) => {
      await updateCalendarEvent(event.id, { completed: !event.completed });
      reload();
    },
    [reload],
  );

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    removeEvent,
    toggleCompleted,
    reload,
  };
}
