import {
  asObject,
  optionalString,
  requireString,
} from "../../../shared/validation.js";

export interface LinkRepositoryInput {
  projectId: string;
  repoId: string;
  owner: string;
  name: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export function parseLinkRepositoryBody(value: unknown): LinkRepositoryInput {
  const record = asObject(value);

  return {
    projectId: requireString(record, "projectId"),
    repoId: requireString(record, "repoId"),
    owner: requireString(record, "owner"),
    name: requireString(record, "name"),
    defaultBranch: optionalString(record, "defaultBranch") ?? "main",
    isPrivate: record.isPrivate === true,
  };
}
