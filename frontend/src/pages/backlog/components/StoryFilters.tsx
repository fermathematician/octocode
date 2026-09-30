import { Select } from "../../../components/shared/Select/Select";
import { STORY_PRIORITY_LABELS } from "../../../domain/story";
import { STORY_PRIORITIES, type Project } from "../../../domain/types";
import type { PriorityFilter } from "../hooks/useBacklog";
import styles from "./StoryFilters.module.css";

interface StoryFiltersProps {
  projects: Project[];
  projectId: string | null;
  onProjectChange: (projectId: string | null) => void;
  priority: PriorityFilter;
  onPriorityChange: (priority: PriorityFilter) => void;
}

const ALL_PROJECTS = "all";

export function StoryFilters({
  projects,
  projectId,
  onProjectChange,
  priority,
  onPriorityChange,
}: StoryFiltersProps) {
  const projectOptions = [
    { value: ALL_PROJECTS, label: "All projects" },
    ...projects.map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ];

  const priorityOptions = [
    { value: "all", label: "All priorities" },
    ...STORY_PRIORITIES.map((value) => ({
      value,
      label: STORY_PRIORITY_LABELS[value],
    })),
  ];

  return (
    <div className={styles.filters}>
      <Select
        id="backlog-project-filter"
        label="Project"
        value={projectId ?? ALL_PROJECTS}
        options={projectOptions}
        onChange={(value) =>
          onProjectChange(value === ALL_PROJECTS ? null : value)
        }
      />
      <Select
        id="backlog-priority-filter"
        label="Priority"
        value={priority}
        options={priorityOptions}
        onChange={(value) => onPriorityChange(value as PriorityFilter)}
      />
    </div>
  );
}
