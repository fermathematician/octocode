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
import {
  parsePagination,
  type Pagination,
} from "../../../shared/pagination.js";
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

export interface UpdateStoryInput {
  title?: string;
  storyPoints?: number;
  priority?: StoryPriority;
}

export interface UpdateStoryStatusInput {
  status: StoryStatus;
}

export interface AssignStoryBranchInput {
  branch: string;
}

export interface MoveStorySprintInput {
  sprintId: string | null;
}

export interface ListStoriesQuery {
  filters: StoryFilters;
  pagination: Pagination;
}

function parseStoryPoints(record: Record<string, unknown>): number {
  const storyPoints = requireInt(record, "storyPoints");

  if (!STORY_POINTS.includes(storyPoints as (typeof STORY_POINTS)[number])) {
    throw new ValidationError(
      `storyPoints must be one of: ${STORY_POINTS.join(", ")}.`,
    );
  }

  return storyPoints;
}

function parsePriority(record: Record<string, unknown>): StoryPriority {
  const priorityName = requireString(record, "priority");
  const priority = PRIORITY_BY_NAME[priorityName];

  if (!priority) {
    throw new ValidationError(
      "priority must be one of: critical, high, medium, low.",
    );
  }

  return priority;
}

export function parseCreateStoryBody(value: unknown): CreateStoryInput {
  const record = asObject(value);
  const branchValue = optionalString(record, "branch");

  return {
    projectId: requireString(record, "projectId"),
    title: requireString(record, "title", { maxLength: 200 }).trim(),
    storyPoints: parseStoryPoints(record),
    priority: parsePriority(record),
    branch:
      branchValue && branchValue.trim()
        ? requireBranchName(record, "branch")
        : undefined,
  };
}

export function parseUpdateStoryBody(value: unknown): UpdateStoryInput {
  const record = asObject(value);
  const input: UpdateStoryInput = {};

  if (record.title !== undefined) {
    input.title = requireString(record, "title", { maxLength: 200 }).trim();
  }

  if (record.storyPoints !== undefined) {
    input.storyPoints = parseStoryPoints(record);
  }

  if (record.priority !== undefined) {
    input.priority = parsePriority(record);
  }

  if (Object.keys(input).length === 0) {
    throw new ValidationError("Provide at least one field to update.");
  }

  return input;
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

export function parseMoveStorySprintBody(value: unknown): MoveStorySprintInput {
  const record = asObject(value);

  if (!("sprintId" in record)) {
    throw new ValidationError(
      "sprintId is required (use null to remove the story from its sprint).",
    );
  }

  const { sprintId } = record;

  if (sprintId === null) {
    return { sprintId: null };
  }

  if (typeof sprintId !== "string" || sprintId.trim().length === 0) {
    throw new ValidationError("sprintId must be a non-empty string or null.");
  }

  return { sprintId: sprintId.trim() };
}

export function parseStoryParams(value: unknown): { storyId: string } {
  return { storyId: requireString(asObject(value), "storyId") };
}

export function parseListStoriesQuery(value: unknown): ListStoriesQuery {
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

  return { filters, pagination: parsePagination(record) };
}
