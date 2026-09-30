import type { ReactNode } from "react";
import type { Project } from "../../domain/types";
import { ProjectSidebar } from "./ProjectSidebar";
import { VIEWS, type ViewId } from "./views";
import styles from "./AppShell.module.css";

interface AppShellProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  activeView: ViewId;
  onSelectView: (viewId: ViewId) => void;
  children: ReactNode;
}

export function AppShell({
  projects,
  activeProjectId,
  onSelectProject,
  activeView,
  onSelectView,
  children,
}: AppShellProps) {
  return (
    <div className={styles.shell}>
      <ProjectSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={onSelectProject}
      />
      <div className={styles.main}>
        <nav className={styles.nav} aria-label="Views">
          {VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              className={`${styles.navItem} ${
                activeView === view.id ? styles.navItemActive : ""
              }`}
              onClick={() => onSelectView(view.id)}
              aria-current={activeView === view.id ? "page" : undefined}
            >
              {view.label}
            </button>
          ))}
        </nav>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
