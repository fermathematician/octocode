import type { Project } from "../../domain/types";
import styles from "./ProjectSidebar.module.css";

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  onSelectProject,
}: ProjectSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>◆</span>
        <span className={styles.brandName}>DevBoard</span>
      </div>

      <nav aria-label="Projects" className={styles.nav}>
        <p className={styles.sectionLabel}>Projects</p>
        <button
          type="button"
          className={`${styles.item} ${
            activeProjectId === null ? styles.itemActive : ""
          }`}
          onClick={() => onSelectProject(null)}
          aria-current={activeProjectId === null ? "true" : undefined}
        >
          <span className={styles.dotAll} aria-hidden="true" />
          All projects
        </button>

        <ul className={styles.list}>
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                className={`${styles.item} ${
                  activeProjectId === project.id ? styles.itemActive : ""
                }`}
                onClick={() => onSelectProject(project.id)}
                aria-current={activeProjectId === project.id ? "true" : undefined}
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
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
