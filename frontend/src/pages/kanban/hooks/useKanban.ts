import { useCallback, useEffect, useMemo, useState } from "react";
import { getProjects } from "../../../api/projects";
import { getSprints } from "../../../api/sprints";
import { getStories, updateStoryStatus } from "../../../api/stories";
import { selectActiveSprints } from "../../../domain/sprint";
import { compareStoriesByPriorityThenAge } from "../../../domain/story";
import { STORY_STATUSES } from "../../../domain/types";
import type { Project, Sprint, Story, StoryStatus } from "../../../domain/types";

export interface KanbanColumnData {
  status: StoryStatus;
  stories: Story[];
}

interface UseKanbanResult {
  columns: KanbanColumnData[];
  projects: Project[];
  activeSprints: Sprint[];
  projectFilter: string | null;
  setProjectFilter: (projectId: string | null) => void;
  totalPoints: number;
  remainingPoints: number;
  loading: boolean;
  error: string | null;
  moveStory: (storyId: string, status: StoryStatus) => Promise<void>;
  reload: () => void;
}

export function useKanban(): UseKanbanResult {
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
          setError("Unable to load the board.");
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

  const activeSprints = useMemo(
    () => selectActiveSprints(sprints, projectFilter),
    [sprints, projectFilter],
  );

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

  return {
    columns,
    projects,
    activeSprints,
    projectFilter,
    setProjectFilter,
    totalPoints,
    remainingPoints,
    loading,
    error,
    moveStory,
    reload,
  };
}
