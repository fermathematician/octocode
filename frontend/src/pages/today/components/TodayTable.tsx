import { Badge } from "../../../components/shared/Badge/Badge";
import { CALENDAR_EVENT_TYPE_LABELS } from "../../../domain/calendar";
import type { CalendarEvent } from "../../../domain/types";
import styles from "./TodayTable.module.css";

interface TodayTableProps {
  events: CalendarEvent[];
}

export function TodayTable({ events }: TodayTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Type</th>
            <th scope="col">Task</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td className={styles.time}>{event.startTime}</td>
              <td>
                <Badge tone={event.type === "meeting" ? "accent" : "neutral"}>
                  {CALENDAR_EVENT_TYPE_LABELS[event.type]}
                </Badge>
              </td>
              <td className={styles.title}>{event.title}</td>
              <td className={styles.notes}>{event.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
