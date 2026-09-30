import { useEffect, useState } from "react";
import { getProjects } from "./api/projects";
import { AppShell } from "./components/layout/AppShell";
import type { ViewId } from "./components/layout/views";
import { Spinner } from "./components/shared/Spinner/Spinner";
import type { Project } from "./domain/types";
import { BacklogPage } from "./pages/backlog";
import { CalendarPage } from "./pages/calendar";
import { ProgressPage } from "./pages/progress";
import { SprintPage } from "./pages/sprint";
import styles from "./App.module.css";

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewId>("backlog");

  useEffect(() => {
    let cancelled = false;

    getProjects()
      .then((loaded) => {
        if (!cancelled) {
          setProjects(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjects([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (projectsLoading) {
    return (
      <div className={styles.loading}>
        <Spinner label="Loading workspace…" />
      </div>
    );
  }

  function renderView() {
    switch (activeView) {
      case "backlog":
        return (
          <BacklogPage
            projectId={activeProjectId}
            projects={projects}
            onSelectProject={setActiveProjectId}
          />
        );
      case "sprint":
        return <SprintPage projectId={activeProjectId} projects={projects} />;
      case "calendar":
        return <CalendarPage />;
      case "progress":
        return (
          <ProgressPage projectId={activeProjectId} projects={projects} />
        );
    }
  }

  return (
    <AppShell
      projects={projects}
      activeProjectId={activeProjectId}
      onSelectProject={setActiveProjectId}
      activeView={activeView}
      onSelectView={setActiveView}
    >
      {renderView()}
    </AppShell>
  );
}
