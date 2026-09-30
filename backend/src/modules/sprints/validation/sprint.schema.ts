import {
  asObject,
  optionalString,
  requireIsoDate,
  requireString,
} from "../../../shared/validation.js";

export interface CreateSprintInput {
  projectId: string;
  name: string;
  startDate: string;
}

export function parseCreateSprintBody(value: unknown): CreateSprintInput {
  const record = asObject(value);

  return {
    projectId: requireString(record, "projectId"),
    name: requireString(record, "name", { maxLength: 120 }).trim(),
    startDate: requireIsoDate(record, "startDate"),
  };
}

export function parseListSprintsQuery(value: unknown): { projectId?: string } {
  const record = asObject(value);
  const projectId = optionalString(record, "projectId");

  return projectId ? { projectId } : {};
}
