import { useCallback, useEffect, useState } from "react";
import {
  createCalendarEvent,
  getCalendarEvents,
  type CreateCalendarEventInput,
} from "../../../api/calendar-events";
import type { CalendarEvent } from "../../../domain/types";

interface UseCalendarEventsResult {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  addEvent: (input: CreateCalendarEventInput) => Promise<void>;
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

  return { events, loading, error, addEvent, reload };
}
