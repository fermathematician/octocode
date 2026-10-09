import { useCallback, useEffect, useMemo, useState } from "react";
import { getProjects } from "../../../api/projects";
import { getSprints } from "../../../api/sprints";
import {
  deleteStory as deleteStoryRequest,
  getStories,
  moveStoryToSprint as moveStoryToSprintRequest,
  updateStory as updateStoryRequest,
  updateStoryStatus,
  type UpdateStoryInput,
} from "../../../api/stories";
import { syncAllCommits, syncStoryCommits } from "../../../api/github";
import { selectActiveSprint } from "../../../domain/sprint";
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
  sprints: Sprint[];
  activeSprint: Sprint | null;
  projectFilter: string | null;
  setProjectFilter: (projectId: string | null) => void;
  totalPoints: number;
  remainingPoints: number;
  loading: boolean;
  error: string | null;
  moveStory: (storyId: string, status: StoryStatus) => Promise<void>;
  updateStory: (storyId: string, input: UpdateStoryInput) => Promise<void>;
  moveToSprint: (storyId: string, sprintId: string | null) => Promise<void>;
  removeStory: (storyId: string) => Promise<void>;
  syncCommits: (storyId: string) => Promise<void>;
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

  // Best-effort sync so the board reflects new branches and pushes without a manual click.
  useEffect(() => {
    let cancelled = false;

    async function syncOnOpen() {
      try {
        await syncAllCommits();
        const updated = await getStories();

        if (!cancelled) {
          setStories(updated);
        }
      } catch {
        // A failed background sync must not break the board.
      }
    }

    void syncOnOpen();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const syncCommits = useCallback(async (storyId: string) => {
    await syncStoryCommits(storyId);
    setStories(await getStories());
  }, []);

  const updateStory = useCallback(
    async (storyId: string, input: UpdateStoryInput) => {
      const updated = await updateStoryRequest(storyId, input);
      setStories((current) =>
        current.map((story) => (story.id === storyId ? updated : story)),
      );
    },
    [],
  );

  const moveToSprint = useCallback(
    async (storyId: string, sprintId: string | null) => {
      const updated = await moveStoryToSprintRequest(storyId, sprintId);
      setStories((current) =>
        current.map((story) => (story.id === storyId ? updated : story)),
      );
    },
    [],
  );

  const removeStory = useCallback(async (storyId: string) => {
    await deleteStoryRequest(storyId);
    setStories((current) =>
      current.filter((story) => story.id !== storyId),
    );
  }, []);

  return {
    columns,
    projects,
    sprints,
    activeSprint,
    projectFilter,
    setProjectFilter,
    totalPoints,
    remainingPoints,
    loading,
    error,
    moveStory,
    updateStory,
    moveToSprint,
    removeStory,
    syncCommits,
    reload,
  };
}
