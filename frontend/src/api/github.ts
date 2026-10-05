import { apiFetch } from "./http";

export interface GithubRepositorySummary {
  repoId: string;
  owner: string;
  name: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export function getGithubRepositories(): Promise<GithubRepositorySummary[]> {
  return apiFetch<GithubRepositorySummary[]>("/github/repositories");
}

export type ProjectBranchSource = "github" | "local";

export interface ProjectBranch {
  name: string;
  /** `local` means the branch exists only in the developer's clone. */
  source: ProjectBranchSource;
}

export function getProjectBranches(
  projectId: string,
): Promise<ProjectBranch[]> {
  return apiFetch<ProjectBranch[]>(`/github/projects/${projectId}/branches`);
}

export interface SyncStoryCommitsResult {
  commitCount: number;
}

export function syncStoryCommits(
  storyId: string,
): Promise<SyncStoryCommitsResult> {
  return apiFetch<SyncStoryCommitsResult>(
    `/github/stories/${storyId}/sync-commits`,
    { method: "POST" },
  );
}

export interface SyncAllCommitsResult {
  branchesCreated: number;
  stories: number;
  commits: number;
}

/** Creates cards for new pushed branches and syncs commits for every story. */
export function syncAllCommits(): Promise<SyncAllCommitsResult> {
  return apiFetch<SyncAllCommitsResult>("/github/sync", { method: "POST" });
}
