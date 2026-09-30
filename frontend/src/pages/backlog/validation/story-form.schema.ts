import {
  STORY_POINTS,
  STORY_PRIORITIES,
  type StoryPoints,
  type StoryPriority,
} from "../../../domain/types";

const BRANCH_PATTERN = /^[A-Za-z0-9._/-]+$/;

export function validateBranchName(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Branch name is required.";
  }

  if (trimmed.length > 120) {
    return "Branch name must be 120 characters or fewer.";
  }

  if (!BRANCH_PATTERN.test(trimmed)) {
    return "Use letters, numbers, dots, slashes, dashes or underscores.";
  }

  return null;
}

export interface CreateStoryFormValues {
  projectId: string;
  title: string;
  storyPoints: StoryPoints;
  priority: StoryPriority;
  branch: string;
}

export interface CreateStoryFormErrors {
  projectId?: string;
  title?: string;
  branch?: string;
}

export function validateCreateStory(
  values: CreateStoryFormValues,
): CreateStoryFormErrors {
  const errors: CreateStoryFormErrors = {};

  if (!values.projectId) {
    errors.projectId = "Select a project.";
  }

  if (!values.title.trim()) {
    errors.title = "Story name is required.";
  }

  if (values.branch.trim()) {
    const branchError = validateBranchName(values.branch);
    if (branchError) {
      errors.branch = branchError;
    }
  }

  return errors;
}

export function isStoryPoints(value: string): value is `${StoryPoints}` {
  return STORY_POINTS.some((points) => String(points) === value);
}

export function isStoryPriority(value: string): value is StoryPriority {
  return STORY_PRIORITIES.some((priority) => priority === value);
}
