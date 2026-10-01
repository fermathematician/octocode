import { useCallback, useEffect, useMemo, useState } from "react";
import { getProjects } from "../../../api/projects";
import {
  deleteSprint as deleteSprintRequest,
  getSprints,
} from "../../../api/sprints";
import { getStories } from "../../../api/stories";
import type { Project, Sprint, Story } from "../../../domain/types";
import { todayIso } from "../../../shared/date";

export type SprintStatus = "upcoming" | "active" | "past";

export interface SprintOverview {
  sprint: Sprint;
  project: Project | undefined;
  totalPoints: number;
  completedPoints: number;
  storyCount: number;
  completedCount: number;
  progress: number;
  status: SprintStatus;
}

interface UseSprintsResult {
  entries: SprintOverview[];
  projects: Project[];
  loading: boolean;
  error: string | null;
  projectFilter: string | null;
  setProjectFilter: (projectId: string | null) => void;
  deleteSprint: (sprintId: string) => Promise<void>;
  reload: () => void;
}

function buildOverviews(
  sprints: Sprint[],
  stories: Story[],
  projects: Project[],
  projectId: string | null,
): SprintOverview[] {
  const today = todayIso();

  return sprints
    .filter((sprint) => projectId === null || sprint.projectId === projectId)
    .map((sprint) => {
      const sprintStories = stories.filter(
        (story) => story.sprintId === sprint.id,
      );
      const totalPoints = sprintStories.reduce(
        (sum, story) => sum + story.storyPoints,
        0,
      );
      const completedStories = sprintStories.filter(
        (story) => story.status === "refactor",
      );
      const completedPoints = completedStories.reduce(
        (sum, story) => sum + story.storyPoints,
        0,
      );

      const status: SprintStatus =
        sprint.endDate < today
          ? "past"
          : sprint.startDate > today
            ? "upcoming"
            : "active";

      return {
        sprint,
        project: projects.find((project) => project.id === sprint.projectId),
        totalPoints,
        completedPoints,
        storyCount: sprintStories.length,
        completedCount: completedStories.length,
        progress: totalPoints === 0 ? 0 : completedPoints / totalPoints,
        status,
      };
    })
    .sort((first, second) =>
      second.sprint.startDate.localeCompare(first.sprint.startDate),
    );
}

export function useSprints(): UseSprintsResult {
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
          setError("Unable to load sprints.");
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
    () => buildOverviews(sprints, stories, projects, projectFilter),
    [sprints, stories, projects, projectFilter],
  );

  const deleteSprint = useCallback(
    async (sprintId: string) => {
      await deleteSprintRequest(sprintId);
      reload();
    },
    [reload],
  );

  return {
    entries,
    projects,
    loading,
    error,
    projectFilter,
    setProjectFilter,
    deleteSprint,
    reload,
  };
}
