import { useState } from "react";
import { CalendarEventEditModal } from "../../components/calendar/CalendarEventEditModal";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import type { CalendarEvent } from "../../domain/types";
import { parseIsoDate, todayIso } from "../../shared/date";
import { useTodayAgenda } from "./hooks/useTodayAgenda";
import { ReminderForm } from "./components/ReminderForm";
import { TodayTable } from "./components/TodayTable";
import styles from "./index.module.css";

export function TodayPage() {
  const {
    events,
    loading,
    error,
    addReminder,
    updateEvent,
    removeEvent,
    toggleCompleted,
    reload,
  } = useTodayAgenda();
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const dateLabel = parseIsoDate(todayIso()).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function handleDelete(event: CalendarEvent) {
    if (window.confirm(`Delete "${event.title}"?`)) {
      void removeEvent(event.id);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Today</h1>
        <p className={styles.subtitle}>{dateLabel}</p>
      </header>

      {loading ? <Spinner label="Loading today's plan…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error ? (
        <div className={styles.layout}>
          <div className={styles.agenda}>
            <h2 className={styles.sectionTitle}>Tasks &amp; reminders</h2>
            {events.length === 0 ? (
              <EmptyState
                title="Nothing planned for today"
                description="Add a reminder or schedule something on the calendar."
              />
            ) : (
              <TodayTable
                events={events}
                onToggleCompleted={(event) => {
                  void toggleCompleted(event);
                }}
                onEdit={(event) => setEditingEvent(event)}
                onDelete={handleDelete}
              />
            )}
          </div>

          <aside className={styles.panel}>
            <h2 className={styles.sectionTitle}>Add reminder</h2>
            <ReminderForm onSubmit={addReminder} />
          </aside>
        </div>
      ) : null}

      {editingEvent ? (
        <CalendarEventEditModal
          event={editingEvent}
          onSave={async (eventId, input) => {
            await updateEvent(eventId, input);
            setEditingEvent(null);
          }}
          onClose={() => setEditingEvent(null)}
        />
      ) : null}
    </section>
  );
}
