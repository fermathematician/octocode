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
