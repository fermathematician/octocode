import type {
  Story,
  StoryPoints,
  StoryPriority,
  StoryStatus,
} from "../domain/types";
import { apiFetch } from "./http";

export interface CreateStoryInput {
  projectId: string;
  title: string;
  storyPoints: StoryPoints;
  priority: StoryPriority;
  branch?: string;
}

export function getStories(): Promise<Story[]> {
  return apiFetch<Story[]>("/stories");
}

export function createStory(input: CreateStoryInput): Promise<Story> {
  return apiFetch<Story>("/stories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function assignStoryBranch(
  storyId: string,
  branch: string,
): Promise<Story> {
  return apiFetch<Story>(`/stories/${storyId}/branch`, {
    method: "PATCH",
    body: JSON.stringify({ branch }),
  });
}

export function updateStoryStatus(
  storyId: string,
  status: StoryStatus,
): Promise<Story> {
  return apiFetch<Story>(`/stories/${storyId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
