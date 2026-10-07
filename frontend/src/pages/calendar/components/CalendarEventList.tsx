import { Badge } from "../../../components/shared/Badge/Badge";
import { Button } from "../../../components/shared/Button/Button";
import { Checkbox } from "../../../components/shared/Checkbox/Checkbox";
import { EmptyState } from "../../../components/shared/EmptyState/EmptyState";
import { CALENDAR_EVENT_TYPE_LABELS } from "../../../domain/calendar";
import type { CalendarEvent } from "../../../domain/types";
import styles from "./CalendarEventList.module.css";

interface CalendarEventListProps {
  events: CalendarEvent[];
  onToggleCompleted: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function CalendarEventList({
  events,
  onToggleCompleted,
  onEdit,
  onDelete,
}: CalendarEventListProps) {
  if (events.length === 0) {
    return <EmptyState title="Nothing scheduled for this day" />;
  }

  const sorted = events
    .slice()
    .sort((first, second) => first.startTime.localeCompare(second.startTime));

  return (
    <ul className={styles.list}>
      {sorted.map((event) => {
        const isTask = event.type === "task";

        return (
          <li key={event.id} className={styles.item}>
            {isTask ? (
              <Checkbox
                id={`calendar-done-${event.id}`}
                ariaLabel={`Mark "${event.title}" as done`}
                checked={event.completed}
                onChange={() => onToggleCompleted(event)}
              />
            ) : null}
            <span className={styles.time}>{event.startTime}</span>
            <div className={styles.body}>
              <span
                className={
                  event.completed ? styles.completedTitle : styles.title
                }
              >
                {event.title}
              </span>
              {event.notes ? (
                <span className={styles.notes}>{event.notes}</span>
              ) : null}
            </div>
            <Badge tone={event.type === "meeting" ? "accent" : "neutral"}>
              {CALENDAR_EVENT_TYPE_LABELS[event.type]}
            </Badge>
            {event.source === "google" ? <Badge>Google</Badge> : null}
            {isTask ? (
              <div className={styles.actions}>
                <Button variant="ghost" onClick={() => onEdit(event)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => onDelete(event)}>
                  Delete
                </Button>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
