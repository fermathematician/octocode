import type { ReactNode } from "react";
import type { Project } from "../../domain/types";
import { ProjectSidebar } from "./ProjectSidebar";
import type { GeneralViewId, ScreenId } from "./views";
import styles from "./AppShell.module.css";

interface AppShellProps {
  projects: Project[];
  activeScreen: ScreenId;
  activeProjectId: string | null;
  onSelectScreen: (viewId: GeneralViewId) => void;
  onSelectProject: (projectId: string | null) => void;
  children: ReactNode;
}

export function AppShell({
  projects,
  activeScreen,
  activeProjectId,
  onSelectScreen,
  onSelectProject,
  children,
}: AppShellProps) {
  return (
    <div className={styles.shell}>
      <ProjectSidebar
        projects={projects}
        activeScreen={activeScreen}
        activeProjectId={activeProjectId}
        onSelectScreen={onSelectScreen}
        onSelectProject={onSelectProject}
      />
      <div className={styles.main}>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
