import { Badge } from "../../../components/shared/Badge/Badge";
import { Button } from "../../../components/shared/Button/Button";
import { Checkbox } from "../../../components/shared/Checkbox/Checkbox";
import { CALENDAR_EVENT_TYPE_LABELS } from "../../../domain/calendar";
import type { CalendarEvent } from "../../../domain/types";
import styles from "./TodayTable.module.css";

interface TodayTableProps {
  events: CalendarEvent[];
  onToggleCompleted: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function TodayTable({
  events,
  onToggleCompleted,
  onEdit,
  onDelete,
}: TodayTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.compact}>
              Done
            </th>
            <th scope="col">Time</th>
            <th scope="col">Type</th>
            <th scope="col">Task</th>
            <th scope="col">Notes</th>
            <th scope="col" className={styles.compact}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isTask = event.type === "task";

            return (
              <tr
                key={event.id}
                className={event.completed ? styles.completed : undefined}
              >
                <td>
                  {isTask ? (
                    <Checkbox
                      id={`today-done-${event.id}`}
                      ariaLabel={`Mark "${event.title}" as done`}
                      checked={event.completed}
                      onChange={() => onToggleCompleted(event)}
                    />
                  ) : null}
                </td>
                <td className={styles.time}>{event.startTime}</td>
                <td>
                  <Badge tone={event.type === "meeting" ? "accent" : "neutral"}>
                    {CALENDAR_EVENT_TYPE_LABELS[event.type]}
                  </Badge>
                </td>
                <td className={styles.title}>{event.title}</td>
                <td className={styles.notes}>{event.notes || "—"}</td>
                <td>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
