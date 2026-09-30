import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { parseIsoDate, todayIso } from "../../shared/date";
import { useTodayAgenda } from "./hooks/useTodayAgenda";
import { ReminderForm } from "./components/ReminderForm";
import { TodayTable } from "./components/TodayTable";
import styles from "./index.module.css";

export function TodayPage() {
  const { events, loading, error, addReminder, reload } = useTodayAgenda();

  const dateLabel = parseIsoDate(todayIso()).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
              <TodayTable events={events} />
            )}
          </div>

          <aside className={styles.panel}>
            <h2 className={styles.sectionTitle}>Add reminder</h2>
            <ReminderForm onSubmit={addReminder} />
          </aside>
        </div>
      ) : null}
    </section>
  );
}
