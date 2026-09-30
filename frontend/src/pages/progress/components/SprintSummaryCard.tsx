import { formatDateRange } from "../../../shared/date";
import type { SprintProgress } from "../hooks/useProjectProgress";
import styles from "./SprintSummaryCard.module.css";

interface SprintSummaryCardProps {
  entry: SprintProgress;
}

export function SprintSummaryCard({ entry }: SprintSummaryCardProps) {
  const percent = Math.round(entry.progress * 100);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <span className={styles.project}>
            {entry.project?.name ?? "Unknown project"}
          </span>
          <h3 className={styles.name}>{entry.sprint.name}</h3>
        </div>
        <span className={styles.dates}>
          {formatDateRange(entry.sprint.startDate, entry.sprint.endDate)}
        </span>
      </header>

      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${entry.sprint.name} progress`}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>

      <dl className={styles.stats}>
        <div>
          <dt>Points</dt>
          <dd>
            {entry.completedPoints} / {entry.totalPoints}
          </dd>
        </div>
        <div>
          <dt>Stories</dt>
          <dd>
            {entry.completedCount} / {entry.storyCount}
          </dd>
        </div>
        <div>
          <dt>Done</dt>
          <dd>{percent}%</dd>
        </div>
      </dl>
    </article>
  );
}
