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

export function getProjectBranches(projectId: string): Promise<string[]> {
  return apiFetch<string[]>(`/github/projects/${projectId}/branches`);
}
