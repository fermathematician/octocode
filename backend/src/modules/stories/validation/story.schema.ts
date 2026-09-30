import {
  StoryPriority,
  StoryStatus,
} from "../../../generated/prisma/client.js";
import {
  ValidationError,
  asObject,
  optionalString,
  requireBranchName,
  requireEnum,
  requireInt,
  requireString,
} from "../../../shared/validation.js";
import type { StoryFilters } from "../repositories/StoryRepository.js";

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

const PRIORITY_BY_NAME: Record<string, StoryPriority> = {
  critical: StoryPriority.CRITICAL,
  high: StoryPriority.HIGH,
  medium: StoryPriority.MEDIUM,
  low: StoryPriority.LOW,
};

const STATUS_BY_NAME: Record<string, StoryStatus> = {
  backlog: StoryStatus.BACKLOG,
  design: StoryStatus.DESIGN,
  code: StoryStatus.CODE,
  test: StoryStatus.TEST,
  refactor: StoryStatus.REFACTOR,
};

export interface CreateStoryInput {
  projectId: string;
  title: string;
  storyPoints: number;
  priority: StoryPriority;
  branch?: string;
}

export interface UpdateStoryStatusInput {
  status: StoryStatus;
}

export interface AssignStoryBranchInput {
  branch: string;
}

export function parseCreateStoryBody(value: unknown): CreateStoryInput {
  const record = asObject(value);
  const storyPoints = requireInt(record, "storyPoints");
  const priorityName = requireString(record, "priority");
  const priority = PRIORITY_BY_NAME[priorityName];
  const branchValue = optionalString(record, "branch");

  if (!STORY_POINTS.includes(storyPoints as (typeof STORY_POINTS)[number])) {
    throw new ValidationError(
      `storyPoints must be one of: ${STORY_POINTS.join(", ")}.`,
    );
  }

  if (!priority) {
    throw new ValidationError(
      "priority must be one of: critical, high, medium, low.",
    );
  }

  return {
    projectId: requireString(record, "projectId"),
    title: requireString(record, "title", { maxLength: 200 }).trim(),
    storyPoints,
    priority,
    branch:
      branchValue && branchValue.trim()
        ? requireBranchName(record, "branch")
        : undefined,
  };
}

export function parseUpdateStatusBody(value: unknown): UpdateStoryStatusInput {
  const record = asObject(value);
  const statusName = requireEnum(record, "status", [
    "backlog",
    "design",
    "code",
    "test",
    "refactor",
  ]);

  return { status: STATUS_BY_NAME[statusName] as StoryStatus };
}

export function parseAssignBranchBody(value: unknown): AssignStoryBranchInput {
  return { branch: requireBranchName(asObject(value), "branch") };
}

export function parseStoryParams(value: unknown): { storyId: string } {
  return { storyId: requireString(asObject(value), "storyId") };
}

export function parseListStoriesQuery(value: unknown): StoryFilters {
  const record = asObject(value);
  const projectId = optionalString(record, "projectId");
  const status = optionalString(record, "status");
  const priority = optionalString(record, "priority");

  const filters: StoryFilters = {};

  if (projectId) {
    filters.projectId = projectId;
  }

  if (status) {
    const mapped = STATUS_BY_NAME[status];

    if (!mapped) {
      throw new ValidationError(
        "status must be one of: backlog, design, code, test, refactor.",
      );
    }

    filters.status = mapped;
  }

  if (priority) {
    const mapped = PRIORITY_BY_NAME[priority];

    if (!mapped) {
      throw new ValidationError(
        "priority must be one of: critical, high, medium, low.",
      );
    }

    filters.priority = mapped;
  }

  return filters;
}
