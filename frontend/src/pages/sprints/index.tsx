import { useState } from "react";
import { Button } from "../../components/shared/Button/Button";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Select } from "../../components/shared/Select/Select";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { CreateSprintModal } from "../../components/sprints/CreateSprintModal";
import { useSprints } from "./hooks/useSprints";
import { SprintCard } from "./components/SprintCard";
import styles from "./index.module.css";

const ALL_PROJECTS = "all";

export function SprintsPage() {
  const {
    entries,
    projects,
    loading,
    error,
    projectFilter,
    setProjectFilter,
    deleteSprint,
    reload,
  } = useSprints();
  const [isCreating, setIsCreating] = useState(false);

  const projectOptions = [
    { value: ALL_PROJECTS, label: "All projects" },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ];

  function handleDelete(sprintId: string, name: string) {
    const confirmed = window.confirm(
      `Delete "${name}"? Its stories stay, but are unassigned from the sprint.`,
    );

    if (confirmed) {
      void deleteSprint(sprintId);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Sprints</h1>
          <p className={styles.subtitle}>
            All sprints across your projects, with progress.
          </p>
        </div>
        <div className={styles.controls}>
          <div className={styles.filter}>
            <Select
              id="sprints-project-filter"
              label="Project"
              value={projectFilter ?? ALL_PROJECTS}
              options={projectOptions}
              onChange={(value) =>
                setProjectFilter(value === ALL_PROJECTS ? null : value)
              }
            />
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            disabled={projects.length === 0}
          >
            Generate sprint
          </Button>
        </div>
      </header>

      {loading ? <Spinner label="Loading sprints…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error && entries.length === 0 ? (
        <EmptyState
          title="No sprints yet"
          description="Use Generate sprint to create a one-week sprint for a project."
        />
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.sprint.id}>
              <SprintCard
                entry={entry}
                onDelete={() => handleDelete(entry.sprint.id, entry.sprint.name)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {isCreating ? (
        <CreateSprintModal
          projects={projects}
          defaultProjectId={projectFilter}
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            reload();
          }}
        />
      ) : null}
    </section>
  );
}
