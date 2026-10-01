import { useMemo, useState } from "react";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Select } from "../../components/shared/Select/Select";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { StoryCommitsModal } from "../../components/stories/StoryCommitsModal";
import { formatDateRange } from "../../shared/date";
import { useKanban } from "./hooks/useKanban";
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
    syncCommits,
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
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const selectedStory =
    columns
      .flatMap((column) => column.stories)
      .find((story) => story.id === selectedStoryId) ?? null;

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
          onSelect={(story) => setSelectedStoryId(story.id)}
        />
      ) : null}

      {selectedStory ? (
        <StoryCommitsModal
          story={selectedStory}
          projectName={projectNames[selectedStory.projectId]}
          onClose={() => setSelectedStoryId(null)}
          onSyncCommits={() => syncCommits(selectedStory.id)}
        />
      ) : null}
    </section>
  );
}
