import { useCallback, useEffect, useMemo, useState } from "react";
import { getProjects } from "../../../api/projects";
import { getSprints } from "../../../api/sprints";
import { getStories } from "../../../api/stories";
import type { Project, Sprint, Story } from "../../../domain/types";

export interface SprintProgress {
  sprint: Sprint;
  projectNames: string[];
  totalPoints: number;
  completedPoints: number;
  storyCount: number;
  completedCount: number;
  progress: number;
}

interface UseProjectProgressResult {
  entries: SprintProgress[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function buildEntries(
  projectId: string | null,
  projects: Project[],
  sprints: Sprint[],
  stories: Story[],
): SprintProgress[] {
  const nameById = Object.fromEntries(
    projects.map((project) => [project.id, project.name]),
  );

  return sprints
    .map((sprint) => {
      const sprintStories = stories.filter(
        (story) => story.sprintId === sprint.id,
      );
      const visible =
        projectId === null
          ? sprintStories
          : sprintStories.filter((story) => story.projectId === projectId);
      const totalPoints = visible.reduce(
        (sum, story) => sum + story.storyPoints,
        0,
      );
      const completedStories = visible.filter(
        (story) => story.status === "refactor",
      );
      const completedPoints = completedStories.reduce(
        (sum, story) => sum + story.storyPoints,
        0,
      );
      const projectNames = [
        ...new Set(
          visible.map(
            (story) => nameById[story.projectId] ?? "Unknown project",
          ),
        ),
      ];

      return {
        sprint,
        projectNames,
        totalPoints,
        completedPoints,
        storyCount: visible.length,
        completedCount: completedStories.length,
        progress: totalPoints === 0 ? 0 : completedPoints / totalPoints,
      };
    })
    .filter((entry) => projectId === null || entry.storyCount > 0)
    .sort((first, second) =>
      second.sprint.startDate.localeCompare(first.sprint.startDate),
    );
}

export function useProjectProgress(
  projectId: string | null,
): UseProjectProgressResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [loadedProjects, loadedSprints, loadedStories] =
          await Promise.all([getProjects(), getSprints(), getStories()]);

        if (!cancelled) {
          setProjects(loadedProjects);
          setSprints(loadedSprints);
          setStories(loadedStories);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load sprint history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const entries = useMemo(
    () => buildEntries(projectId, projects, sprints, stories),
    [projectId, projects, sprints, stories],
  );

  return { entries, loading, error, reload };
}
