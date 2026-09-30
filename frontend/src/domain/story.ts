import type { Story, StoryPriority, StoryStatus } from "./types";

export const STORY_PRIORITY_ORDER: Record<StoryPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const STORY_PRIORITY_LABELS: Record<StoryPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  backlog: "Backlog",
  design: "Design",
  code: "Code",
  test: "Test",
  refactor: "Refactor",
};

export function compareStoriesByPriorityThenAge(
  first: Story,
  second: Story,
): number {
  const priorityDifference =
    STORY_PRIORITY_ORDER[first.priority] -
    STORY_PRIORITY_ORDER[second.priority];

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return (
    new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
  );
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-+|-+$/g, "");
}

export function branchNameFromTitle(title: string): string {
  const slug = slugifyTitle(title) || "story";
  return `feat/${slug}`;
}
