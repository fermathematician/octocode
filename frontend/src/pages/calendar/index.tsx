import { useState } from "react";
import { CalendarEventEditModal } from "../../components/calendar/CalendarEventEditModal";
import { CalendarEventForm } from "../../components/calendar/CalendarEventForm";
import { Button } from "../../components/shared/Button/Button";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import type { CalendarEvent } from "../../domain/types";
import {
  formatMonthLabel,
  formatShortDate,
  startOfMonth,
  todayIso,
} from "../../shared/date";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { CalendarEventList } from "./components/CalendarEventList";
import { CalendarGrid } from "./components/CalendarGrid";
import { CalendarSyncBar } from "./components/CalendarSyncBar";
import styles from "./index.module.css";

export function CalendarPage() {
  const {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    removeEvent,
    toggleCompleted,
    reload,
  } = useCalendarEvents();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() => todayIso());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const selectedEvents = events.filter(
    (event) => event.date === selectedDate,
  );

  function goToPreviousMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function goToNextMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  function handleDelete(event: CalendarEvent) {
    if (window.confirm(`Delete "${event.title}"?`)) {
      void removeEvent(event.id);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendar</h1>
          <p className={styles.subtitle}>
            Reminders, short tasks and meetings beyond the coding board.
          </p>
        </div>
        <div className={styles.monthNav}>
          <Button variant="secondary" onClick={goToPreviousMonth}>
            ‹
          </Button>
          <span className={styles.monthLabel}>
            {formatMonthLabel(visibleMonth)}
          </span>
          <Button variant="secondary" onClick={goToNextMonth}>
            ›
          </Button>
        </div>
      </header>

      <CalendarSyncBar onDataChanged={reload} />

      {loading ? <Spinner label="Loading calendar…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error ? (
        <div className={styles.layout}>
          <CalendarGrid
            month={visibleMonth}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <aside className={styles.panel}>
            <section className={styles.panelSection}>
              <h2 className={styles.panelTitle}>
                {formatShortDate(selectedDate)}
              </h2>
              <CalendarEventList
                events={selectedEvents}
                onToggleCompleted={(event) => {
                  void toggleCompleted(event);
                }}
                onEdit={(event) => setEditingEvent(event)}
                onDelete={handleDelete}
              />
            </section>
            <section className={styles.panelSection}>
              <h2 className={styles.panelTitle}>Add event</h2>
              <CalendarEventForm
                key={selectedDate}
                defaultDate={selectedDate}
                onSubmit={async (input) => {
                  await addEvent(input);
                }}
              />
            </section>
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
