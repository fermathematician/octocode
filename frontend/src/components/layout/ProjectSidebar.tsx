import type { CurrentUser, Project } from "../../domain/types";
import { GENERAL_VIEW_GROUPS, type GeneralViewId, type ScreenId } from "./views";
import styles from "./ProjectSidebar.module.css";

interface ProjectSidebarProps {
  projects: Project[];
  user: CurrentUser;
  activeScreen: ScreenId;
  activeProjectId: string | null;
  onSelectScreen: (viewId: GeneralViewId) => void;
  onSelectProject: (projectId: string | null) => void;
  onDeleteProject: (project: Project) => void;
  onLogout: () => void;
}

export function ProjectSidebar({
  projects,
  user,
  activeScreen,
  activeProjectId,
  onSelectScreen,
  onSelectProject,
  onDeleteProject,
  onLogout,
}: ProjectSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>◆</span>
        <span className={styles.brandName}>DevBoard</span>
      </div>

      {GENERAL_VIEW_GROUPS.map((group) => (
        <nav
          key={group.label}
          aria-label={group.label}
          className={styles.nav}
        >
          <p className={styles.sectionLabel}>{group.label}</p>
          <ul className={styles.list}>
            {group.views.map((view) => (
              <li key={view.id}>
                <button
                  type="button"
                  className={`${styles.item} ${
                    activeScreen === view.id ? styles.itemActive : ""
                  }`}
                  onClick={() => onSelectScreen(view.id)}
                  aria-current={activeScreen === view.id ? "page" : undefined}
                >
                  {view.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ))}

      <nav aria-label="Projects" className={styles.nav}>
        <p className={styles.sectionLabel}>Projects</p>
        <button
          type="button"
          className={`${styles.item} ${
            activeScreen === "project" && activeProjectId === null
              ? styles.itemActive
              : ""
          }`}
          onClick={() => onSelectProject(null)}
          aria-current={
            activeScreen === "project" && activeProjectId === null
              ? "page"
              : undefined
          }
        >
          <span className={styles.dotAll} aria-hidden="true" />
          All projects
        </button>

        <ul className={styles.list}>
          {projects.map((project) => {
            const isActive =
              activeScreen === "project" && activeProjectId === project.id;

            return (
              <li key={project.id} className={styles.projectRow}>
                <button
                  type="button"
                  className={`${styles.item} ${
                    isActive ? styles.itemActive : ""
                  }`}
                  onClick={() => onSelectProject(project.id)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={styles.dot}
                    style={{ backgroundColor: project.color }}
                    aria-hidden="true"
                  />
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>{project.name}</span>
                    <span className={styles.itemMeta}>
                      {project.githubAccount}/{project.repository}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.deleteProject}
                  onClick={() => onDeleteProject(project)}
                  aria-label={`Delete project ${project.name}`}
                  title="Delete project"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.user}>
        {user.avatarUrl ? (
          <img className={styles.avatar} src={user.avatarUrl} alt="" />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">
            {user.login.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className={styles.userText}>
          <span className={styles.userName}>{user.name ?? user.login}</span>
          <span className={styles.userLogin}>@{user.login}</span>
        </span>
        <button type="button" className={styles.signOut} onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
