import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Select } from "../../components/shared/Select/Select";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { useBurndown } from "./hooks/useBurndown";
import { BurndownChart } from "./components/BurndownChart";
import { SprintHeader } from "./components/SprintHeader";
import styles from "./index.module.css";

const ALL_PROJECTS = "all";

export function GraphPage() {
  const {
    points,
    activeSprint,
    projects,
    projectFilter,
    setProjectFilter,
    totalPoints,
    remainingPoints,
    loading,
    error,
    reload,
  } = useBurndown();

  const projectOptions = [
    { value: ALL_PROJECTS, label: "All projects" },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Burndown</h1>
          <p className={styles.subtitle}>
            Story points remaining across the active sprint.
          </p>
        </div>
        <div className={styles.filter}>
          <Select
            id="graph-project-filter"
            label="Project"
            value={projectFilter ?? ALL_PROJECTS}
            options={projectOptions}
            onChange={(value) =>
              setProjectFilter(value === ALL_PROJECTS ? null : value)
            }
          />
        </div>
      </header>

      {loading ? <Spinner label="Loading burndown…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error && !activeSprint ? (
        <EmptyState
          title="No active sprint"
          description="Start a sprint to track story points remaining over time."
        />
      ) : null}

      {!loading && !error && activeSprint ? (
        <>
          <SprintHeader
            sprint={activeSprint}
            totalPoints={totalPoints}
            remainingPoints={remainingPoints}
          />
          <BurndownChart points={points} totalPoints={totalPoints} />
        </>
      ) : null}
    </section>
  );
}
