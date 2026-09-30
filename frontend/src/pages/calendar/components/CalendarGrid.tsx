import type { CalendarEvent } from "../../../domain/types";
import {
  addDays,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  toIsoDate,
} from "../../../shared/date";
import styles from "./CalendarGrid.module.css";

interface CalendarGridProps {
  month: Date;
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid({
  month,
  events,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const gridStart = startOfWeek(startOfMonth(month));
  const days = Array.from({ length: 42 }, (_, index) =>
    addDays(gridStart, index),
  );

  return (
    <div className={styles.grid}>
      {WEEKDAYS.map((weekday) => (
        <div key={weekday} className={styles.weekday}>
          {weekday}
        </div>
      ))}
      {days.map((day) => {
        const iso = toIsoDate(day);
        const dayEvents = events.filter((event) => event.date === iso);
        const classes = [styles.day];

        if (!isSameMonth(day, month)) {
          classes.push(styles.dayOutside);
        }

        if (iso === selectedDate) {
          classes.push(styles.daySelected);
        }

        return (
          <button
            key={iso}
            type="button"
            className={classes.join(" ")}
            onClick={() => onSelectDate(iso)}
            aria-pressed={iso === selectedDate}
          >
            <span className={styles.dayNumber}>{day.getDate()}</span>
            <span className={styles.dots}>
              {dayEvents.slice(0, 4).map((event) => (
                <span
                  key={event.id}
                  className={`${styles.dot} ${styles[event.type]}`}
                  title={event.title}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
