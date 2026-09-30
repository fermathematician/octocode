import {
  asObject,
  optionalString,
  requireString,
} from "../../../shared/validation.js";

export interface CreateProjectInput {
  name: string;
  color: string;
}

export function parseCreateProjectBody(value: unknown): CreateProjectInput {
  const record = asObject(value);
  const name = requireString(record, "name", { maxLength: 120 });
  const color = optionalString(record, "color") ?? "#4f46e5";

  return { name: name.trim(), color };
}

export function parseProjectParams(value: unknown): { projectId: string } {
  return { projectId: requireString(asObject(value), "projectId") };
}
