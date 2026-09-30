import {
  ValidationError,
  asObject,
  optionalString,
  requireIsoDate,
  requireString,
} from "../../../shared/validation.js";
import {
  parsePagination,
  type Pagination,
} from "../../../shared/pagination.js";

export interface ListSprintsQuery {
  projectId?: string;
  pagination: Pagination;
}

export interface CreateSprintInput {
  projectId: string;
  name: string;
  startDate: string;
}

export interface UpdateSprintInput {
  name?: string;
  startDate?: string;
}

export function parseCreateSprintBody(value: unknown): CreateSprintInput {
  const record = asObject(value);

  return {
    projectId: requireString(record, "projectId"),
    name: requireString(record, "name", { maxLength: 120 }).trim(),
    startDate: requireIsoDate(record, "startDate"),
  };
}

export function parseUpdateSprintBody(value: unknown): UpdateSprintInput {
  const record = asObject(value);
  const input: UpdateSprintInput = {};

  if (record.name !== undefined) {
    input.name = requireString(record, "name", { maxLength: 120 }).trim();
  }

  if (record.startDate !== undefined) {
    input.startDate = requireIsoDate(record, "startDate");
  }

  if (Object.keys(input).length === 0) {
    throw new ValidationError("Provide at least one field to update.");
  }

  return input;
}

export function parseListSprintsQuery(value: unknown): ListSprintsQuery {
  const record = asObject(value);
  const projectId = optionalString(record, "projectId");

  return {
    ...(projectId ? { projectId } : {}),
    pagination: parsePagination(record),
  };
}

export function parseSprintParams(value: unknown): { sprintId: string } {
  return { sprintId: requireString(asObject(value), "sprintId") };
}
