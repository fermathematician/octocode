import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";
import { AppError } from "../../../shared/appError.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";
import type { ProjectRepository } from "../../projects/repositories/ProjectRepository.js";

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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Debug helper: shows exactly what the app fetches from GitHub for each linked
 * project — the branch list and the newest 100 commits of the default branch.
 */
export class GetDebugOverviewService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly oauthAccounts: OAuthAccountRepository,
    private readonly tokenCipher: TokenCipher,
    private readonly githubClient: GithubClient,
  ) {}

  async execute(ownerId: string): Promise<DebugOverview> {
    const account = await this.oauthAccounts.findByUser(
      ownerId,
      OAuthProvider.GITHUB,
    );

    if (!account) {
      throw new AppError("GitHub account is not connected.", 400);
    }

    const accessToken = this.tokenCipher.decrypt(account.accessToken);
    const page = await this.projects.findManyByOwner(ownerId, { limit: 100 });

    const repositories: DebugRepositoryOverview[] = [];

    for (const project of page.items) {
      const repository = project.repository;

      if (!repository) {
        repositories.push({
          projectId: project.id,
          projectName: project.name,
          repository: null,
          branchCount: 0,
          branches: [],
          branchError: "Project has no linked GitHub repository.",
          commits: [],
          commitError: null,
        });
        continue;
      }

      let branches: string[] = [];
      let branchError: string | null = null;

      try {
        branches = (
          await this.githubClient.listBranches(
            accessToken,
            repository.owner,
            repository.name,
          )
        ).map((branch) => branch.name);
      } catch (error) {
        branchError = errorMessage(error);
      }

      let commits: DebugCommit[] = [];
      let commitError: string | null = null;

      try {
        const fetched = await this.githubClient.listCommits(
          accessToken,
          repository.owner,
          repository.name,
          repository.defaultBranch,
        );

        commits = fetched.slice(0, 100).map((commit) => ({
          sha: commit.sha,
          message: commit.message,
          author: commit.authorLogin ?? commit.authorName ?? "unknown",
          committedAt: commit.committedAt.toISOString(),
        }));
      } catch (error) {
        commitError = errorMessage(error);
      }

      repositories.push({
        projectId: project.id,
        projectName: project.name,
        repository: {
          owner: repository.owner,
          name: repository.name,
          defaultBranch: repository.defaultBranch,
        },
        branchCount: branches.length,
        branches,
        branchError,
        commits,
        commitError,
      });
    }

    return { generatedAt: new Date().toISOString(), repositories };
  }
}
