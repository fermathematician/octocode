import { Badge } from "../../../components/shared/Badge/Badge";
import { EmptyState } from "../../../components/shared/EmptyState/EmptyState";
import { CALENDAR_EVENT_TYPE_LABELS } from "../../../domain/calendar";
import type { CalendarEvent } from "../../../domain/types";
import styles from "./CalendarEventList.module.css";

interface CalendarEventListProps {
  events: CalendarEvent[];
}

export function CalendarEventList({ events }: CalendarEventListProps) {
  if (events.length === 0) {
    return <EmptyState title="Nothing scheduled for this day" />;
  }

  const sorted = events
    .slice()
    .sort((first, second) => first.startTime.localeCompare(second.startTime));

  return (
    <ul className={styles.list}>
      {sorted.map((event) => (
        <li key={event.id} className={styles.item}>
          <span className={styles.time}>{event.startTime}</span>
          <div className={styles.body}>
            <span className={styles.title}>{event.title}</span>
            {event.notes ? (
              <span className={styles.notes}>{event.notes}</span>
            ) : null}
          </div>
          <Badge tone={event.type === "meeting" ? "accent" : "neutral"}>
            {CALENDAR_EVENT_TYPE_LABELS[event.type]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
