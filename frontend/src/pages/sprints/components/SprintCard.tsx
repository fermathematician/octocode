import { Button } from "../../../components/shared/Button/Button";
import { formatDateRange } from "../../../shared/date";
import type { SprintOverview } from "../hooks/useSprints";
import styles from "./SprintCard.module.css";

interface SprintCardProps {
  entry: SprintOverview;
  onDelete: () => void;
}

const STATUS_LABELS = {
  upcoming: "Upcoming",
  active: "Active",
  past: "Past",
} as const;

export function SprintCard({ entry, onDelete }: SprintCardProps) {
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
        <div className={styles.meta}>
          <span className={`${styles.status} ${styles[entry.status]}`}>
            {STATUS_LABELS[entry.status]}
          </span>
          <span className={styles.dates}>
            {formatDateRange(entry.sprint.startDate, entry.sprint.endDate)}
          </span>
        </div>
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

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </article>
  );
}
