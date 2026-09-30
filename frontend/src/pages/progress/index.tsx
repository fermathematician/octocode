import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import type { Project } from "../../domain/types";
import { useProjectProgress } from "./hooks/useProjectProgress";
import { SprintHistoryList } from "./components/SprintHistoryList";
import styles from "./index.module.css";

interface ProgressPageProps {
  projectId: string | null;
  projects: Project[];
}

export function ProgressPage({ projectId, projects }: ProgressPageProps) {
  const { entries, loading, error, reload } = useProjectProgress(projectId);

  const projectName =
    projectId === null
      ? "All projects"
      : (projects.find((project) => project.id === projectId)?.name ??
        "Project");

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{projectName} progress</h1>
        <p className={styles.subtitle}>
          Sprint-by-sprint history to compare committed and completed work.
        </p>
      </header>

      {loading ? <Spinner label="Loading sprint history…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error && entries.length === 0 ? (
        <EmptyState
          title="No sprints yet"
          description="Sprint history will appear here once sprints are created."
        />
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <SprintHistoryList entries={entries} />
      ) : null}
    </section>
  );
}
