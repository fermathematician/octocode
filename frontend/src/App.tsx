import { useEffect, useState } from "react";
import { getProjects } from "./api/projects";
import { LoginScreen } from "./auth/LoginScreen";
import { useCurrentUser } from "./auth/useCurrentUser";
import { AppShell } from "./components/layout/AppShell";
import type { GeneralViewId, ScreenId } from "./components/layout/views";
import { Spinner } from "./components/shared/Spinner/Spinner";
import type { Project } from "./domain/types";
import { CalendarPage } from "./pages/calendar";
import { DebugPage } from "./pages/debug";
import { GraphPage } from "./pages/graph";
import { KanbanPage } from "./pages/kanban";
import { ProjectPage } from "./pages/project";
import { SprintsPage } from "./pages/sprints";
import { TodayPage } from "./pages/today";
import styles from "./App.module.css";

export function App() {
  const { user, loading: userLoading, logout } = useCurrentUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [screen, setScreen] = useState<ScreenId>("kanban");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const loaded = await getProjects();
        if (!cancelled) {
          setProjects(loaded);
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function selectScreen(viewId: GeneralViewId) {
    setScreen(viewId);
  }

  function selectProject(projectId: string | null) {
    setActiveProjectId(projectId);
    setScreen("project");
  }

  function handleProjectCreated(project: Project) {
    setProjects((current) => [...current, project]);
    selectProject(project.id);
  }

  function handleProjectUpdated(project: Project) {
    setProjects((current) =>
      current.map((item) => (item.id === project.id ? project : item)),
    );
  }

  function handleProjectDeleted(projectId: string) {
    setProjects((current) =>
      current.filter((item) => item.id !== projectId),
    );
    setActiveProjectId(null);
    setScreen("project");
  }

  if (userLoading) {
    return (
      <div className={styles.loading}>
        <Spinner label="Loading workspace…" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
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
      case "sprints":
        return <SprintsPage />;
      case "kanban":
        return <KanbanPage />;
      case "graph":
        return <GraphPage />;
      case "calendar":
        return <CalendarPage />;
      case "debug":
        return <DebugPage />;
      case "project":
        return (
          <ProjectPage
            projectId={activeProjectId}
            projects={projects}
            onSelectProject={selectProject}
            onProjectCreated={handleProjectCreated}
            onProjectUpdated={handleProjectUpdated}
            onProjectDeleted={handleProjectDeleted}
          />
        );
    }
  }

  return (
    <AppShell
      projects={projects}
      user={user}
      activeScreen={screen}
      activeProjectId={activeProjectId}
      onSelectScreen={selectScreen}
      onSelectProject={selectProject}
      onLogout={logout}
    >
      {renderScreen()}
    </AppShell>
  );
}
