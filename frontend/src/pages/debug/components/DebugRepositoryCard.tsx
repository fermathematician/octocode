import type { DebugRepositoryOverview } from "../../../api/debug";
import { Badge } from "../../../components/shared/Badge/Badge";
import styles from "./DebugRepositoryCard.module.css";

interface DebugRepositoryCardProps {
  entry: DebugRepositoryOverview;
}

export function DebugRepositoryCard({ entry }: DebugRepositoryCardProps) {
  const newest = entry.commits[0];
  const today = new Date().toISOString().slice(0, 10);
  const newestIsToday = newest ? newest.committedAt.slice(0, 10) === today : false;

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <span className={styles.project}>{entry.projectName}</span>
          <h2 className={styles.repo}>
            {entry.repository
              ? `${entry.repository.owner}/${entry.repository.name}`
              : "No linked repository"}
          </h2>
        </div>
        <div className={styles.meta}>
          {entry.repository ? (
            <Badge>default {entry.repository.defaultBranch}</Badge>
          ) : null}
          <Badge tone="accent">{entry.branchCount} branches</Badge>
          {newest ? (
            <Badge tone={newestIsToday ? "low" : "neutral"}>
              newest {newest.committedAt.slice(0, 10)}
            </Badge>
          ) : null}
        </div>
      </header>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Branches fetched</h3>
        {entry.branchError ? (
          <p className={styles.error}>{entry.branchError}</p>
        ) : (
          <p className={styles.branches}>
            {entry.branches.length > 0
              ? entry.branches.join(" · ")
              : "No branches returned."}
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Recent commits on the default branch ({entry.commits.length})
        </h3>
        {entry.commitError ? (
          <p className={styles.error}>{entry.commitError}</p>
        ) : entry.commits.length === 0 ? (
          <p className={styles.muted}>No commits returned.</p>
        ) : (
          <ul className={styles.commits}>
            {entry.commits.map((commit) => (
              <li key={commit.sha} className={styles.commit}>
                <span className={styles.commitMessage}>{commit.message}</span>
                <span className={styles.commitMeta}>
                  <code className={styles.sha}>{commit.sha.slice(0, 7)}</code>
                  <span>{commit.author}</span>
                  <span>{new Date(commit.committedAt).toLocaleString()}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
