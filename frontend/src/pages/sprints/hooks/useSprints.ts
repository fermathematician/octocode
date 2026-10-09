import { useCallback, useEffect, useMemo, useState } from "react";
import { getProjects } from "../../../api/projects";
import {
  deleteSprint as deleteSprintRequest,
  getSprints,
  updateSprint as updateSprintRequest,
  type UpdateSprintInput,
} from "../../../api/sprints";
import { getStories } from "../../../api/stories";
import type { Project, Sprint, Story } from "../../../domain/types";
import { todayIso } from "../../../shared/date";

export type SprintStatus = "upcoming" | "active" | "past";

export interface SprintOverview {
  sprint: Sprint;
  projectNames: string[];
  totalPoints: number;
  completedPoints: number;
  storyCount: number;
  completedCount: number;
  progress: number;
  status: SprintStatus;
}

interface UseSprintsResult {
  entries: SprintOverview[];
  loading: boolean;
  error: string | null;
  deleteSprint: (sprintId: string) => Promise<void>;
  editSprint: (sprintId: string, input: UpdateSprintInput) => Promise<void>;
  reload: () => void;
}

function buildOverviews(
  sprints: Sprint[],
  stories: Story[],
  projects: Project[],
): SprintOverview[] {
  const today = todayIso();
  const nameById = Object.fromEntries(
    projects.map((project) => [project.id, project.name]),
  );

  return sprints
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
      const projectNames = [
        ...new Set(
          sprintStories.map(
            (story) => nameById[story.projectId] ?? "Unknown project",
          ),
        ),
      ];

      const status: SprintStatus =
        sprint.endDate < today
          ? "past"
          : sprint.startDate > today
            ? "upcoming"
            : "active";

      return {
        sprint,
        projectNames,
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
    () => buildOverviews(sprints, stories, projects),
    [sprints, stories, projects],
  );

  const deleteSprint = useCallback(
    async (sprintId: string) => {
      await deleteSprintRequest(sprintId);
      reload();
    },
    [reload],
  );

  const editSprint = useCallback(
    async (sprintId: string, input: UpdateSprintInput) => {
      await updateSprintRequest(sprintId, input);
      reload();
    },
    [reload],
  );

  return {
    entries,
    loading,
    error,
    deleteSprint,
    editSprint,
    reload,
  };
}
