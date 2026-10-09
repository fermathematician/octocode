import type {
  Story,
  StoryPoints,
  StoryPriority,
  StoryStatus,
} from "../domain/types";
import { apiFetch, type Paginated } from "./http";

export interface CreateStoryInput {
  projectId: string;
  title: string;
  storyPoints: StoryPoints;
  priority: StoryPriority;
  branch?: string;
}

export async function getStories(): Promise<Story[]> {
  const page = await apiFetch<Paginated<Story>>("/stories");
  return page.items;
}

export function createStory(input: CreateStoryInput): Promise<Story> {
  return apiFetch<Story>("/stories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateStoryInput {
  title?: string;
  storyPoints?: StoryPoints;
  priority?: StoryPriority;
}

export function updateStory(
  storyId: string,
  input: UpdateStoryInput,
): Promise<Story> {
  return apiFetch<Story>(`/stories/${storyId}`, {
    method: "PATCH",
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

export function moveStoryToSprint(
  storyId: string,
  sprintId: string | null,
): Promise<Story> {
  return apiFetch<Story>(`/stories/${storyId}/sprint`, {
    method: "PATCH",
    body: JSON.stringify({ sprintId }),
  });
}

export function deleteStory(storyId: string): Promise<void> {
  return apiFetch<void>(`/stories/${storyId}`, { method: "DELETE" });
}
