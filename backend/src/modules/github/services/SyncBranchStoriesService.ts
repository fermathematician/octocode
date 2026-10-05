import {
  OAuthProvider,
  StoryPriority,
  StoryStatus,
} from "../../../generated/prisma/client.js";
import type { GithubRepository } from "../../../generated/prisma/client.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type {
  GithubClient,
  GithubCommitSummary,
} from "../../../infrastructure/github/GithubClient.js";
import { AppError } from "../../../shared/appError.js";
import { titleFromBranch } from "../../../shared/branch.js";
import { mapPrismaError } from "../../../shared/prismaErrors.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";
import type { SprintRepository } from "../../sprints/repositories/SprintRepository.js";
import type { StoryRepository } from "../../stories/repositories/StoryRepository.js";
import type { GithubRepositoryRepository } from "../repositories/GithubRepositoryRepository.js";

export interface SyncBranchStoriesResult {
  created: number;
}

/**
 * Reconciles pushed GitHub branches with story cards: every branch that has no
 * story yet and whose own commits (not the ones inherited from the default
 * branch) happened during the latest sprint becomes a backlog card on that
 * sprint. The default branch is ignored, and branches with no new commit since
 * the sprint started are left alone.
 *
 * Commits are not stored here — the commit sync that runs right after populates
 * each new card from its branch.
 */
export class SyncBranchStoriesService {
  constructor(
    private readonly repositories: GithubRepositoryRepository,
    private readonly stories: StoryRepository,
    private readonly sprints: SprintRepository,
    private readonly oauthAccounts: OAuthAccountRepository,
    private readonly tokenCipher: TokenCipher,
    private readonly githubClient: GithubClient,
  ) {}

  executeForUser(ownerId: string): Promise<SyncBranchStoriesResult> {
    return this.repositories
      .findAllByUser(ownerId)
      .then((repositories) => this.executeForRepositories(repositories));
  }

  executeAll(): Promise<SyncBranchStoriesResult> {
    return this.repositories
      .findAll()
      .then((repositories) => this.executeForRepositories(repositories));
  }

  executeForRepository(
    repository: GithubRepository,
  ): Promise<SyncBranchStoriesResult> {
    return this.executeForRepositories([repository]);
  }

  private async executeForRepositories(
    repositories: GithubRepository[],
  ): Promise<SyncBranchStoriesResult> {
    let created = 0;

    for (const repository of repositories) {
      try {
        created += await this.executeForOne(repository);
      } catch (error) {
        // One repository's failure must not stop the rest.
        console.error("Branch story sync failed.", {
          projectId: repository.projectId,
          error,
        });
      }
    }

    return { created };
  }

  private async executeForOne(repository: GithubRepository): Promise<number> {
    const sprint = await this.sprints.findLatestByOwner(repository.userId);

    if (!sprint) {
      return 0;
    }

    const account = await this.oauthAccounts.findByUser(
      repository.userId,
      OAuthProvider.GITHUB,
    );

    if (!account) {
      return 0;
    }

    const accessToken = this.tokenCipher.decrypt(account.accessToken);
    const branches = await this.githubClient.listBranches(
      accessToken,
      repository.owner,
      repository.name,
    );
    const known = new Set(
      await this.stories.findBranchesByProject(repository.projectId),
    );

    let created = 0;

    for (const branch of branches) {
      if (branch.name === repository.defaultBranch || known.has(branch.name)) {
        continue;
      }

      const commits = await this.listOwnBranchCommits(
        accessToken,
        repository,
        branch.name,
      );
      const newest = commits.reduce<Date | null>(
        (latest, commit) =>
          latest === null || commit.committedAt > latest
            ? commit.committedAt
            : latest,
        null,
      );

      // Only branches with their own activity after the sprint started auto-appear.
      if (newest === null || newest < sprint.startDate) {
        continue;
      }

      try {
        await this.stories.create({
          projectId: repository.projectId,
          sprintId: sprint.id,
          title: titleFromBranch(branch.name),
          storyPoints: 1,
          priority: StoryPriority.MEDIUM,
          status: StoryStatus.BACKLOG,
          branch: branch.name,
          imported: true,
        });

        created += 1;
      } catch (error) {
        // A concurrent sync may have created the same branch story already.
        if (mapPrismaError(error)?.statusCode === 409) {
          continue;
        }

        throw error;
      }
    }

    return created;
  }

  private async listOwnBranchCommits(
    accessToken: string,
    repository: GithubRepository,
    branch: string,
  ): Promise<GithubCommitSummary[]> {
    try {
      const comparison = await this.githubClient.compareBranches(
        accessToken,
        repository.owner,
        repository.name,
        repository.defaultBranch,
        branch,
      );

      return comparison.commits;
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        return [];
      }

      throw error;
    }
  }
}
