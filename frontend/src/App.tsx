import { useEffect, useState } from "react";
import { getProjects } from "./api/projects";
import { AppShell } from "./components/layout/AppShell";
import type { GeneralViewId, ScreenId } from "./components/layout/views";
import { Spinner } from "./components/shared/Spinner/Spinner";
import type { Project } from "./domain/types";
import { CalendarPage } from "./pages/calendar";
import { GraphPage } from "./pages/graph";
import { KanbanPage } from "./pages/kanban";
import { ProjectPage } from "./pages/project";
import { TodayPage } from "./pages/today";
import styles from "./App.module.css";

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [screen, setScreen] = useState<ScreenId>("kanban");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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

  function selectScreen(viewId: GeneralViewId) {
    setScreen(viewId);
  }

  function selectProject(projectId: string | null) {
    setActiveProjectId(projectId);
    setScreen("project");
  }

  if (projectsLoading) {
    return (
      <div className={styles.loading}>
        <Spinner label="Loading workspace…" />
      </div>
    );
  }

  function renderScreen() {
    switch (screen) {
      case "today":
        return <TodayPage />;
      case "kanban":
        return <KanbanPage />;
      case "graph":
        return <GraphPage />;
      case "calendar":
        return <CalendarPage />;
      case "project":
        return (
          <ProjectPage
            projectId={activeProjectId}
            projects={projects}
            onSelectProject={selectProject}
          />
        );
    }
  }

  return (
    <AppShell
      projects={projects}
      activeScreen={screen}
      activeProjectId={activeProjectId}
      onSelectScreen={selectScreen}
      onSelectProject={selectProject}
    >
      {renderScreen()}
    </AppShell>
  );
}
