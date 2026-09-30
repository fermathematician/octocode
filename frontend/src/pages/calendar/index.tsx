import { useState } from "react";
import { Button } from "../../components/shared/Button/Button";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import {
  formatMonthLabel,
  formatShortDate,
  startOfMonth,
  todayIso,
} from "../../shared/date";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { CalendarEventForm } from "./components/CalendarEventForm";
import { CalendarEventList } from "./components/CalendarEventList";
import { CalendarGrid } from "./components/CalendarGrid";
import { CalendarSyncBar } from "./components/CalendarSyncBar";
import styles from "./index.module.css";

export function CalendarPage() {
  const { events, loading, error, addEvent, reload } = useCalendarEvents();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() => todayIso());

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
              <CalendarEventList events={selectedEvents} />
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
    </section>
  );
}
