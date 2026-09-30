import {
  ValidationError,
  asObject,
  optionalString,
  requireString,
} from "../../../shared/validation.js";
import {
  parsePagination,
  type Pagination,
} from "../../../shared/pagination.js";

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export interface ListProjectsQuery {
  pagination: Pagination;
}

export interface CreateProjectInput {
  name: string;
  color: string;
}

export interface UpdateProjectInput {
  name?: string;
  color?: string;
}

export function parseListProjectsQuery(value: unknown): ListProjectsQuery {
  return { pagination: parsePagination(asObject(value)) };
}

export function parseCreateProjectBody(value: unknown): CreateProjectInput {
  const record = asObject(value);
  const name = requireString(record, "name", { maxLength: 120 });
  const color = optionalString(record, "color") ?? "#4f46e5";

  if (!COLOR_PATTERN.test(color)) {
    throw new ValidationError("color must be a hex color like #4f46e5.");
  }

  return { name: name.trim(), color };
}

export function parseUpdateProjectBody(value: unknown): UpdateProjectInput {
  const record = asObject(value);
  const input: UpdateProjectInput = {};

  if (record.name !== undefined) {
    input.name = requireString(record, "name", { maxLength: 120 }).trim();
  }

  if (record.color !== undefined) {
    const color = optionalString(record, "color");

    if (!color || !COLOR_PATTERN.test(color)) {
      throw new ValidationError("color must be a hex color like #4f46e5.");
    }

    input.color = color;
  }

  if (Object.keys(input).length === 0) {
    throw new ValidationError("Provide at least one field to update.");
  }

  return input;
}

export interface CreateProjectFromRepositoryInput {
  name: string;
  color: string;
  repoId: string;
  owner: string;
  repositoryName: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export function parseCreateProjectFromRepositoryBody(
  value: unknown,
): CreateProjectFromRepositoryInput {
  const record = asObject(value);
  const color = optionalString(record, "color") ?? "#4f46e5";

  if (!COLOR_PATTERN.test(color)) {
    throw new ValidationError("color must be a hex color like #4f46e5.");
  }

  const repositoryName = requireString(record, "repositoryName", {
    maxLength: 120,
  }).trim();
  const providedName = optionalString(record, "name");
  const name =
    providedName && providedName.trim() ? providedName.trim() : repositoryName;

  return {
    name,
    color,
    repoId: requireString(record, "repoId"),
    owner: requireString(record, "owner"),
    repositoryName,
    defaultBranch: optionalString(record, "defaultBranch") ?? "main",
    isPrivate: record.isPrivate === true,
  };
}

export function parseProjectParams(value: unknown): { projectId: string } {
  return { projectId: requireString(asObject(value), "projectId") };
}
