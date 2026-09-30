import { useState } from "react";
import type { Project } from "../../domain/types";
import { BacklogPage } from "../backlog";
import { ProgressPage } from "../progress";
import styles from "./index.module.css";

type ProjectTabId = "backlog" | "progress";

interface ProjectPageProps {
  projectId: string | null;
  projects: Project[];
  onSelectProject: (projectId: string | null) => void;
}

const TABS: { id: ProjectTabId; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "progress", label: "Progress" },
];

export function ProjectPage({
  projectId,
  projects,
  onSelectProject,
}: ProjectPageProps) {
  const [tab, setTab] = useState<ProjectTabId>("backlog");

  return (
    <section className={styles.page}>
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

      {tab === "backlog" ? (
        <BacklogPage
          projectId={projectId}
          projects={projects}
          onSelectProject={onSelectProject}
        />
      ) : (
        <ProgressPage projectId={projectId} projects={projects} />
      )}
    </section>
  );
}
