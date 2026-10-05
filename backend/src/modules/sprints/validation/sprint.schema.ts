import {
  ValidationError,
  asObject,
  requireIsoDate,
  requireString,
} from "../../../shared/validation.js";
import {
  parsePagination,
  type Pagination,
} from "../../../shared/pagination.js";

export interface ListSprintsQuery {
  pagination: Pagination;
}

export interface CreateSprintInput {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintInput {
  name?: string;
  startDate?: string;
  endDate?: string;
}

export function parseCreateSprintBody(value: unknown): CreateSprintInput {
  const record = asObject(value);

  return {
    name: requireString(record, "name", { maxLength: 120 }).trim(),
    startDate: requireIsoDate(record, "startDate"),
    endDate: requireIsoDate(record, "endDate"),
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

  if (record.endDate !== undefined) {
    input.endDate = requireIsoDate(record, "endDate");
  }

  if (Object.keys(input).length === 0) {
    throw new ValidationError("Provide at least one field to update.");
  }

  return input;
}

export function parseListSprintsQuery(value: unknown): ListSprintsQuery {
  return { pagination: parsePagination(asObject(value)) };
}

export function parseSprintParams(value: unknown): { sprintId: string } {
  return { sprintId: requireString(asObject(value), "sprintId") };
}
