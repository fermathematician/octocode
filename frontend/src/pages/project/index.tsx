import { useState } from "react";
import { Button } from "../../components/shared/Button/Button";
import type { Project } from "../../domain/types";
import { BacklogPage } from "../backlog";
import { ProgressPage } from "../progress";
import { AddProjectModal } from "./components/AddProjectModal";
import styles from "./index.module.css";

type ProjectTabId = "backlog" | "progress";

interface ProjectPageProps {
  projectId: string | null;
  projects: Project[];
  onSelectProject: (projectId: string | null) => void;
  onProjectCreated: (project: Project) => void;
}

const TABS: { id: ProjectTabId; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "progress", label: "Progress" },
];

export function ProjectPage({
  projectId,
  projects,
  onSelectProject,
  onProjectCreated,
}: ProjectPageProps) {
  const [tab, setTab] = useState<ProjectTabId>("backlog");
  const [isAdding, setIsAdding] = useState(false);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.tabs} aria-label="Project views">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.tab} ${
                tab === item.id ? styles.tabActive : ""
              }`}
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {projectId === null ? (
          <Button variant="secondary" onClick={() => setIsAdding(true)}>
            Add project
          </Button>
        ) : null}
      </header>

      {tab === "backlog" ? (
        <BacklogPage
          projectId={projectId}
          projects={projects}
          onSelectProject={onSelectProject}
        />
      ) : (
        <ProgressPage projectId={projectId} projects={projects} />
      )}

      {isAdding ? (
        <AddProjectModal
          onClose={() => setIsAdding(false)}
          onCreated={(project) => {
            setIsAdding(false);
            onProjectCreated(project);
          }}
        />
      ) : null}
    </section>
  );
}
