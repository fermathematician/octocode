import {
  asObject,
  optionalString,
  requireString,
  requireStringArray,
  ValidationError,
} from "../../../shared/validation.js";

export interface LinkRepositoryInput {
  projectId: string;
  repoId: string;
  owner: string;
  name: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export interface RecordLocalBranchesInput {
  owner: string;
  name: string;
  names: string[];
}

const MAX_LOCAL_BRANCHES = 500;
const MAX_BRANCH_LENGTH = 255;

function hasWhitespaceOrControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;

    if (character.trim() === "" || code <= 0x1f || code === 0x7f) {
      return true;
    }
  }

  return false;
}

/**
 * Body of `POST /github/branches/local`, sent by the local git hook. The hook
 * identifies the repository by `owner`/`name` (parsed from the git remote) so it
 * does not need to know the project id.
 */
export function parseRecordLocalBranchesBody(
  value: unknown,
): RecordLocalBranchesInput {
  const record = asObject(value);
  const names = requireStringArray(record, "names", {
    maxItems: MAX_LOCAL_BRANCHES,
    maxLength: MAX_BRANCH_LENGTH,
  });

  for (const branch of names) {
    if (hasWhitespaceOrControlCharacter(branch)) {
      throw new ValidationError(
        "names must not contain whitespace or control characters.",
      );
    }
  }

  return {
    owner: requireString(record, "owner", { maxLength: 120 }).trim(),
    name: requireString(record, "name", { maxLength: 200 }).trim(),
    names,
  };
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
