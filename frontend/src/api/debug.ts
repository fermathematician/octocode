import { apiFetch } from "./http";

export interface DebugCommit {
  sha: string;
  message: string;
  author: string;
  committedAt: string;
}

export interface DebugRepositoryOverview {
  projectId: string;
  projectName: string;
  repository: { owner: string; name: string; defaultBranch: string } | null;
  branchCount: number;
  branches: string[];
  branchError: string | null;
  commits: DebugCommit[];
  commitError: string | null;
}

export interface DebugOverview {
  generatedAt: string;
  repositories: DebugRepositoryOverview[];
}

export function getDebugOverview(): Promise<DebugOverview> {
  return apiFetch<DebugOverview>("/debug/overview");
}
