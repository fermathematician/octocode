import type { Sprint } from "../../../domain/types";
import { formatDateRange } from "../../../shared/date";
import styles from "./SprintHeader.module.css";

interface SprintHeaderProps {
  sprints: Sprint[];
  totalPoints: number;
  remainingPoints: number;
}

export function SprintHeader({
  sprints,
  totalPoints,
  remainingPoints,
}: SprintHeaderProps) {
  const title =
    sprints.length === 1 ? sprints[0].name : "All active sprints";
  const completedPoints = totalPoints - remainingPoints;

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.dates}>
          {sprints.length === 0
            ? "No sprint is currently active."
            : sprints
                .map((sprint) => formatDateRange(sprint.startDate, sprint.endDate))
                .join(" · ")}
        </p>
      </div>
      <dl className={styles.stats}>
        <div>
          <dt>Committed</dt>
          <dd>{totalPoints} pts</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{completedPoints} pts</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>{remainingPoints} pts</dd>
        </div>
      </dl>
    </header>
  );
}
