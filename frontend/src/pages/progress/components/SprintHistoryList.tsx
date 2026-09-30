import type { SprintProgress } from "../hooks/useProjectProgress";
import { SprintSummaryCard } from "./SprintSummaryCard";
import styles from "./SprintHistoryList.module.css";

interface SprintHistoryListProps {
  entries: SprintProgress[];
}

export function SprintHistoryList({ entries }: SprintHistoryListProps) {
  return (
    <ul className={styles.list}>
      {entries.map((entry) => (
        <li key={entry.sprint.id}>
          <SprintSummaryCard entry={entry} />
        </li>
      ))}
    </ul>
  );
}
