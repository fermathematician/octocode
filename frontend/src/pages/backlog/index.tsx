import { useMemo, useState } from "react";
import { Button } from "../../components/shared/Button/Button";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Modal } from "../../components/shared/Modal/Modal";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import type { Project } from "../../domain/types";
import { useBacklog } from "./hooks/useBacklog";
import { CreateStoryForm } from "./components/CreateStoryForm";
import { StoryDetailModal } from "./components/StoryDetailModal";
import { StoryFilters } from "./components/StoryFilters";
import { StoryList } from "./components/StoryList";
import styles from "./index.module.css";

interface BacklogPageProps {
  projectId: string | null;
  projects: Project[];
  onSelectProject: (projectId: string | null) => void;
}

export function BacklogPage({
  projectId,
  projects,
  onSelectProject,
}: BacklogPageProps) {
  const {
    stories,
    loading,
    error,
    priorityFilter,
    setPriorityFilter,
    assignBranch,
    addStory,
    reload,
  } = useBacklog(projectId);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const projectNames = useMemo(() => {
    return Object.fromEntries(projects.map((project) => [project.id, project.name]));
  }, [projects]);

  const selectedStory =
    stories.find((story) => story.id === selectedStoryId) ?? null;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Backlog</h1>
          <p className={styles.subtitle}>
            Weight stories with points and priority, then pull them into a
            sprint.
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>New story</Button>
      </header>

      <StoryFilters
        projects={projects}
        projectId={projectId}
        onProjectChange={onSelectProject}
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      {loading ? <Spinner label="Loading backlog…" /> : null}

      {!loading && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}

      {!loading && !error && stories.length === 0 ? (
        <EmptyState
          title="No stories in the backlog"
          description="Create a story to start planning work."
        />
      ) : null}

      {!loading && !error && stories.length > 0 ? (
        <StoryList
          stories={stories}
          projectNames={projectNames}
          onSelect={(story) => setSelectedStoryId(story.id)}
        />
      ) : null}

      {selectedStory ? (
        <StoryDetailModal
          story={selectedStory}
          project={projects.find(
            (project) => project.id === selectedStory.projectId,
          )}
          onClose={() => setSelectedStoryId(null)}
          onAssignBranch={async (branch) => {
            await assignBranch(selectedStory.id, branch);
          }}
        />
      ) : null}

      {isCreating ? (
        <Modal title="New story" onClose={() => setIsCreating(false)}>
          <CreateStoryForm
            projects={projects}
            defaultProjectId={projectId}
            onCancel={() => setIsCreating(false)}
            onSubmit={async (input) => {
              await addStory(input);
              setIsCreating(false);
            }}
          />
        </Modal>
      ) : null}
    </section>
  );
}
