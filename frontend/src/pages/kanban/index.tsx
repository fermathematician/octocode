import { useMemo, useState } from "react";
import { Button } from "../../components/shared/Button/Button";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Select } from "../../components/shared/Select/Select";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { formatDateRange } from "../../shared/date";
import { useKanban } from "./hooks/useKanban";
import { CreateSprintModal } from "./components/CreateSprintModal";
import { KanbanBoard } from "./components/KanbanBoard";
import styles from "./index.module.css";

const ALL_PROJECTS = "all";

export function KanbanPage() {
  const {
    columns,
    projects,
    activeSprints,
    projectFilter,
    setProjectFilter,
    totalPoints,
    remainingPoints,
    loading,
    error,
    moveStory,
    reload,
  } = useKanban();

  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const projectOptions = [
    { value: ALL_PROJECTS, label: "All projects" },
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ];

  const hasStories = columns.some((column) => column.stories.length > 0);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Kanban</h1>
          <p className={styles.subtitle}>
            {activeSprints.length === 0
              ? "No active sprint."
              : activeSprints
                  .map((sprint) =>
                    formatDateRange(sprint.startDate, sprint.endDate),
                  )
                  .join(" · ")}
            {" · "}
            {remainingPoints} of {totalPoints} pts remaining
          </p>
        </div>
        <div className={styles.controls}>
          <div className={styles.filter}>
            <Select
              id="kanban-project-filter"
              label="Project"
              value={projectFilter ?? ALL_PROJECTS}
              options={projectOptions}
              onChange={(value) =>
                setProjectFilter(value === ALL_PROJECTS ? null : value)
              }
            />
          </div>
          <Button
            onClick={() => setIsCreatingSprint(true)}
            disabled={projects.length === 0}
          >
            Generate sprint
          </Button>
        </div>
      </header>

      {loading ? <Spinner label="Loading board…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error && activeSprints.length === 0 ? (
        <EmptyState
          title="No active sprint"
          description="Start a sprint to move stories through the board."
        />
      ) : null}

      {!loading && !error && activeSprints.length > 0 && !hasStories ? (
        <EmptyState
          title="No stories in the active sprint"
          description="Add stories to the backlog to populate the board."
        />
      ) : null}

      {!loading && !error && hasStories ? (
        <KanbanBoard
          columns={columns}
          projectNames={projectNames}
          onMove={(storyId, status) => {
            void moveStory(storyId, status);
          }}
        />
      ) : null}

      {isCreatingSprint ? (
        <CreateSprintModal
          projects={projects}
          defaultProjectId={projectFilter}
          onClose={() => setIsCreatingSprint(false)}
          onCreated={() => {
            setIsCreatingSprint(false);
            reload();
          }}
        />
      ) : null}
    </section>
  );
}
