import { Button } from "../../components/shared/Button/Button";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { useDebugOverview } from "./hooks/useDebugOverview";
import { DebugRepositoryCard } from "./components/DebugRepositoryCard";
import styles from "./index.module.css";

export function DebugPage() {
  const { overview, loading, error, reload } = useDebugOverview();

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Debug</h1>
          <p className={styles.subtitle}>
            What the app fetches from GitHub right now — the branches and the
            newest 100 commits of each linked repo's default branch.
          </p>
        </div>
        <Button variant="secondary" onClick={reload} disabled={loading}>
          Refresh
        </Button>
      </header>

      {loading ? <Spinner label="Fetching from GitHub…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error && overview ? (
        <>
          <p className={styles.generated}>
            Fetched at {new Date(overview.generatedAt).toLocaleString()}
          </p>

          {overview.repositories.length === 0 ? (
            <p className={styles.muted}>No projects yet.</p>
          ) : (
            <ul className={styles.list}>
              {overview.repositories.map((entry) => (
                <li key={entry.projectId}>
                  <DebugRepositoryCard entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}
