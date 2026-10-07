import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  type UpdateCalendarEventInput,
} from "../../../api/calendar-events";
import type { CalendarEvent } from "../../../domain/types";
import { todayIso } from "../../../shared/date";

export interface ReminderInput {
  title: string;
  startTime: string;
}

interface UseTodayAgendaResult {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  addReminder: (input: ReminderInput) => Promise<void>;
  updateEvent: (
    eventId: string,
    input: UpdateCalendarEventInput,
  ) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
  toggleCompleted: (event: CalendarEvent) => Promise<void>;
  reload: () => void;
}

export function useTodayAgenda(): UseTodayAgendaResult {
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
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
          setAllEvents(loaded);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load today's plan.");
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

  const events = useMemo(
    () =>
      allEvents
        .filter((event) => event.date === todayIso())
        .slice()
        .sort((first, second) =>
          first.startTime.localeCompare(second.startTime),
        ),
    [allEvents],
  );

  const addReminder = useCallback(
    async (input: ReminderInput) => {
      await createCalendarEvent({
        type: "reminder",
        title: input.title.trim(),
        date: todayIso(),
        startTime: input.startTime,
      });
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
    addReminder,
    updateEvent,
    removeEvent,
    toggleCompleted,
    reload,
  };
}
