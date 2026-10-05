import { useCallback, useEffect, useMemo, useState } from "react";
import { getProjects } from "../../../api/projects";
import { getSprints } from "../../../api/sprints";
import { getStories } from "../../../api/stories";
import { buildBurndown, selectActiveSprint } from "../../../domain/sprint";
import type { BurndownPoint } from "../../../domain/sprint";
import type { Project, Sprint, Story } from "../../../domain/types";

interface UseBurndownResult {
  points: BurndownPoint[];
  activeSprint: Sprint | null;
  projects: Project[];
  projectFilter: string | null;
  setProjectFilter: (projectId: string | null) => void;
  totalPoints: number;
  remainingPoints: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useBurndown(): UseBurndownResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

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
          setError("Unable to load the burndown.");
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

  const activeSprint = useMemo(() => selectActiveSprint(sprints), [sprints]);

  const sprintStories = useMemo(() => {
    if (!activeSprint) {
      return [];
    }

    return stories.filter(
      (story) =>
        story.sprintId === activeSprint.id &&
        (projectFilter === null || story.projectId === projectFilter),
    );
  }, [stories, activeSprint, projectFilter]);

  const points = useMemo(
    () => buildBurndown(activeSprint ? [activeSprint] : [], sprintStories),
    [activeSprint, sprintStories],
  );

  const totalPoints = useMemo(
    () => sprintStories.reduce((sum, story) => sum + story.storyPoints, 0),
    [sprintStories],
  );

  const remainingPoints = useMemo(
    () =>
      sprintStories
        .filter((story) => story.status !== "refactor")
        .reduce((sum, story) => sum + story.storyPoints, 0),
    [sprintStories],
  );

  return {
    points,
    activeSprint,
    projects,
    projectFilter,
    setProjectFilter,
    totalPoints,
    remainingPoints,
    loading,
    error,
    reload,
  };
}
