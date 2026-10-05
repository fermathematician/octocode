import type { Sprint } from "../../../domain/types";
import { formatDateRange } from "../../../shared/date";
import styles from "./SprintHeader.module.css";

interface SprintHeaderProps {
  sprint: Sprint;
  totalPoints: number;
  remainingPoints: number;
}

export function SprintHeader({
  sprint,
  totalPoints,
  remainingPoints,
}: SprintHeaderProps) {
  const completedPoints = totalPoints - remainingPoints;

  return (
    <header className={styles.header}>
      <div>
        <h2 className={styles.title}>{sprint.name}</h2>
        <p className={styles.dates}>
          {formatDateRange(sprint.startDate, sprint.endDate)}
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
