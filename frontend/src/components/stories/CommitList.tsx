import type { Commit } from "../../domain/types";
import styles from "./CommitList.module.css";

interface CommitListProps {
  commits: Commit[];
}

export function CommitList({ commits }: CommitListProps) {
  if (commits.length === 0) {
    return (
      <p className={styles.empty}>
        No commits yet. Use “Sync commits” to fetch them from the story branch.
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.count}>
        {commits.length} commit{commits.length === 1 ? "" : "s"}
      </p>
      <ul className={styles.list}>
        {commits.map((commit) => (
          <li key={commit.id} className={styles.commit}>
            <span className={styles.message}>{commit.message}</span>
            <span className={styles.meta}>
              <code className={styles.sha}>{commit.sha.slice(0, 7)}</code>
              <span>{commit.author}</span>
              <span>
                {new Date(commit.committedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
