import { useState } from "react";
import { updateProject, type UpdateProjectInput } from "../../api/projects";
import { Button } from "../../components/shared/Button/Button";
import { ProjectEditModal } from "../../components/project/ProjectEditModal";
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
  onProjectUpdated: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
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
  onProjectUpdated,
  onDeleteProject,
}: ProjectPageProps) {
  const [tab, setTab] = useState<ProjectTabId>("backlog");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currentProject =
    projectId === null
      ? null
      : (projects.find((project) => project.id === projectId) ?? null);

  async function handleSave(input: UpdateProjectInput) {
    if (!currentProject) {
      return;
    }

    const updated = await updateProject(currentProject.id, input);
    onProjectUpdated(updated);
    setIsEditing(false);
  }

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
        ) : (
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              Edit project
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (currentProject) {
                  onDeleteProject(currentProject);
                }
              }}
            >
              Delete project
            </Button>
          </div>
        )}
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

      {isEditing && currentProject ? (
        <ProjectEditModal
          project={currentProject}
          onSave={handleSave}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </section>
  );
}
