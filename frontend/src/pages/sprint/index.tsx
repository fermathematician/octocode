import { useMemo } from "react";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import { ErrorState } from "../../components/shared/ErrorState/ErrorState";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import type { Project } from "../../domain/types";
import { useSprint } from "./hooks/useSprint";
import { BurndownChart } from "./components/BurndownChart";
import { KanbanBoard } from "./components/KanbanBoard";
import { SprintHeader } from "./components/SprintHeader";
import styles from "./index.module.css";

interface SprintPageProps {
  projectId: string | null;
  projects: Project[];
}

export function SprintPage({ projectId, projects }: SprintPageProps) {
  const {
    activeSprints,
    columns,
    burndown,
    totalPoints,
    remainingPoints,
    loading,
    error,
    moveStory,
    reload,
  } = useSprint(projectId);

  const projectNames = useMemo(() => {
    if (projectId !== null) {
      return {};
    }

    return Object.fromEntries(
      projects.map((project) => [project.id, project.name]),
    );
  }, [projects, projectId]);

  if (loading) {
    return <Spinner label="Loading sprint…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (activeSprints.length === 0) {
    return (
      <EmptyState
        title="No active sprint"
        description="Start a sprint to move stories through design, code, test and refactor."
      />
    );
  }

  return (
    <section className={styles.page}>
      <SprintHeader
        sprints={activeSprints}
        totalPoints={totalPoints}
        remainingPoints={remainingPoints}
      />
      <BurndownChart points={burndown} totalPoints={totalPoints} />
      <KanbanBoard
        columns={columns}
        projectNames={projectNames}
        onMove={(storyId, status) => {
          void moveStory(storyId, status);
        }}
      />
    </section>
  );
}
