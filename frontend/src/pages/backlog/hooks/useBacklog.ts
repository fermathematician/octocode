import { useCallback, useEffect, useMemo, useState } from "react";
import {
  assignStoryBranch,
  createStory,
  getStories,
  updateStory as updateStoryRequest,
  type CreateStoryInput,
  type UpdateStoryInput,
} from "../../../api/stories";
import { syncStoryCommits, syncAllCommits } from "../../../api/github";
import { compareStoriesByPriorityThenAge } from "../../../domain/story";
import type { Story, StoryPriority } from "../../../domain/types";

export type PriorityFilter = StoryPriority | "all";

interface UseBacklogResult {
  stories: Story[];
  loading: boolean;
  error: string | null;
  priorityFilter: PriorityFilter;
  setPriorityFilter: (filter: PriorityFilter) => void;
  assignBranch: (storyId: string, branch: string) => Promise<void>;
  addStory: (input: CreateStoryInput) => Promise<void>;
  updateStory: (storyId: string, input: UpdateStoryInput) => Promise<void>;
  syncCommits: (storyId: string) => Promise<void>;
  reload: () => void;
}

export function useBacklog(projectId: string | null): UseBacklogResult {
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const stories = await getStories();
        if (!cancelled) {
          setAllStories(stories);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load stories.");
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

  // Best-effort sync so the backlog reflects recent pushes without a manual click.
  useEffect(() => {
    let cancelled = false;

    async function syncOnOpen() {
      try {
        await syncAllCommits();
        const updated = await getStories();

        if (!cancelled) {
          setAllStories(updated);
        }
      } catch {
        // A failed background sync must not break the backlog.
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

  const stories = useMemo(() => {
    return allStories
      .filter((story) => story.status === "backlog")
      .filter((story) => projectId === null || story.projectId === projectId)
      .filter(
        (story) => priorityFilter === "all" || story.priority === priorityFilter,
      )
      .slice()
      .sort(compareStoriesByPriorityThenAge);
  }, [allStories, projectId, priorityFilter]);

  const assignBranch = useCallback(
    async (storyId: string, branch: string) => {
      await assignStoryBranch(storyId, branch);
      reload();
    },
    [reload],
  );

  const addStory = useCallback(
    async (input: CreateStoryInput) => {
      await createStory(input);
      reload();
    },
    [reload],
  );

  const updateStory = useCallback(
    async (storyId: string, input: UpdateStoryInput) => {
      const updated = await updateStoryRequest(storyId, input);
      setAllStories((current) =>
        current.map((story) => (story.id === storyId ? updated : story)),
      );
    },
    [],
  );

  const syncCommits = useCallback(
    async (storyId: string) => {
      await syncStoryCommits(storyId);
      reload();
    },
    [reload],
  );

  return {
    stories,
    loading,
    error,
    priorityFilter,
    setPriorityFilter,
    assignBranch,
    addStory,
    updateStory,
    syncCommits,
    reload,
  };
}
