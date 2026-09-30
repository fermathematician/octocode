import { useCallback, useEffect, useMemo, useState } from "react";
import { getSprints } from "../../../api/sprints";
import { getStories, updateStoryStatus } from "../../../api/stories";
import { compareStoriesByPriorityThenAge } from "../../../domain/story";
import type { Sprint, Story, StoryStatus } from "../../../domain/types";
import { STORY_STATUSES } from "../../../domain/types";
import {
  addDays,
  daysBetween,
  parseIsoDate,
  toIsoDate,
} from "../../../shared/date";

export interface BurndownPoint {
  day: number;
  ideal: number;
  remaining: number;
}

export interface KanbanColumnData {
  status: StoryStatus;
  stories: Story[];
}

interface UseSprintResult {
  activeSprints: Sprint[];
  columns: KanbanColumnData[];
  burndown: BurndownPoint[];
  totalPoints: number;
  remainingPoints: number;
  loading: boolean;
  error: string | null;
  moveStory: (storyId: string, status: StoryStatus) => Promise<void>;
  reload: () => void;
}

function latestSprintPerProject(sprints: Sprint[]): Sprint[] {
  const latest = new Map<string, Sprint>();

  for (const sprint of sprints) {
    const current = latest.get(sprint.projectId);
    if (!current || sprint.startDate > current.startDate) {
      latest.set(sprint.projectId, sprint);
    }
  }

  return [...latest.values()];
}

function buildBurndown(sprints: Sprint[], stories: Story[]): BurndownPoint[] {
  if (sprints.length === 0) {
    return [];
  }

  const start = sprints.reduce(
    (earliest, sprint) =>
      sprint.startDate < earliest ? sprint.startDate : earliest,
    sprints[0].startDate,
  );
  const end = sprints.reduce(
    (latest, sprint) => (sprint.endDate > latest ? sprint.endDate : latest),
    sprints[0].endDate,
  );
  const totalDays = Math.max(1, daysBetween(start, end));
  const totalPoints = stories.reduce(
    (sum, story) => sum + story.storyPoints,
    0,
  );

  const startDate = parseIsoDate(start);
  const points: BurndownPoint[] = [];

  for (let day = 0; day <= totalDays; day += 1) {
    const currentDate = toIsoDate(addDays(startDate, day));
    const completed = stories
      .filter(
        (story) =>
          story.status === "refactor" &&
          story.completedAt !== null &&
          story.completedAt <= currentDate,
      )
      .reduce((sum, story) => sum + story.storyPoints, 0);

    points.push({
      day,
      ideal: Math.max(0, totalPoints - (totalPoints / totalDays) * day),
      remaining: Math.max(0, totalPoints - completed),
    });
  }

  return points;
}

export function useSprint(projectId: string | null): UseSprintResult {
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
        const [loadedSprints, loadedStories] = await Promise.all([
          getSprints(),
          getStories(),
        ]);

        if (!cancelled) {
          setSprints(loadedSprints);
          setStories(loadedStories);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load the sprint.");
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

  const activeSprints = useMemo(() => {
    if (sprints.length === 0) {
      return [];
    }

    if (projectId) {
      const projectSprints = sprints.filter(
        (sprint) => sprint.projectId === projectId,
      );

      if (projectSprints.length === 0) {
        return [];
      }

      return [
        projectSprints
          .slice()
          .sort((first, second) =>
            second.startDate.localeCompare(first.startDate),
          )[0],
      ];
    }

    return latestSprintPerProject(sprints);
  }, [sprints, projectId]);

  const sprintIds = useMemo(
    () => new Set(activeSprints.map((sprint) => sprint.id)),
    [activeSprints],
  );

  const sprintStories = useMemo(
    () =>
      stories.filter(
        (story) => story.sprintId !== null && sprintIds.has(story.sprintId),
      ),
    [stories, sprintIds],
  );

  const columns = useMemo<KanbanColumnData[]>(
    () =>
      STORY_STATUSES.map((status) => ({
        status,
        stories: sprintStories
          .filter((story) => story.status === status)
          .slice()
          .sort(compareStoriesByPriorityThenAge),
      })),
    [sprintStories],
  );

  const burndown = useMemo(
    () => buildBurndown(activeSprints, sprintStories),
    [activeSprints, sprintStories],
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

  const moveStory = useCallback(
    async (storyId: string, status: StoryStatus) => {
      const updated = await updateStoryStatus(storyId, status);
      setStories((current) =>
        current.map((story) => (story.id === storyId ? updated : story)),
      );
    },
    [],
  );

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    activeSprints,
    columns,
    burndown,
    totalPoints,
    remainingPoints,
    loading,
    error,
    moveStory,
    reload,
  };
}
