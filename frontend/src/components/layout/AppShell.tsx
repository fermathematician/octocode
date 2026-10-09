import type { ReactNode } from "react";
import type { CurrentUser, Project } from "../../domain/types";
import { ProjectSidebar } from "./ProjectSidebar";
import type { GeneralViewId, ScreenId } from "./views";
import styles from "./AppShell.module.css";

interface AppShellProps {
  projects: Project[];
  user: CurrentUser;
  activeScreen: ScreenId;
  activeProjectId: string | null;
  onSelectScreen: (viewId: GeneralViewId) => void;
  onSelectProject: (projectId: string | null) => void;
  onDeleteProject: (project: Project) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function AppShell({
  projects,
  user,
  activeScreen,
  activeProjectId,
  onSelectScreen,
  onSelectProject,
  onDeleteProject,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className={styles.shell}>
      <ProjectSidebar
        projects={projects}
        user={user}
        activeScreen={activeScreen}
        activeProjectId={activeProjectId}
        onSelectScreen={onSelectScreen}
        onSelectProject={onSelectProject}
        onDeleteProject={onDeleteProject}
        onLogout={onLogout}
      />
      <div className={styles.main}>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
