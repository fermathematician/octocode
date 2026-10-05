import {
  OAuthProvider,
  StoryPriority,
  StoryStatus,
} from "../../../generated/prisma/client.js";
import type { GithubRepository } from "../../../generated/prisma/client.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";
import { titleFromBranch } from "../../../shared/branch.js";
import { mapPrismaError } from "../../../shared/prismaErrors.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";
import type { SprintRepository } from "../../sprints/repositories/SprintRepository.js";
import type { StoryRepository } from "../../stories/repositories/StoryRepository.js";
import type { CommitRepository } from "../repositories/CommitRepository.js";
import type { GithubRepositoryRepository } from "../repositories/GithubRepositoryRepository.js";

export interface SyncBranchStoriesResult {
  created: number;
}

/**
 * Reconciles pushed GitHub branches with story cards: every branch that has no
 * story yet and whose newest commit happened during the latest sprint becomes a
 * card on that sprint. The default branch is ignored, and branches created
 * before the sprint (no commit since its start) are left alone.
 */
export class SyncBranchStoriesService {
  constructor(
    private readonly repositories: GithubRepositoryRepository,
    private readonly stories: StoryRepository,
    private readonly sprints: SprintRepository,
    private readonly commits: CommitRepository,
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

      const commits = await this.githubClient.listCommits(
        accessToken,
        repository.owner,
        repository.name,
        branch.name,
      );
      const newest = commits[0];

      // Only branches with activity after the sprint started auto-appear.
      if (!newest || newest.committedAt < sprint.startDate) {
        continue;
      }

      try {
        const story = await this.stories.create({
          projectId: repository.projectId,
          sprintId: sprint.id,
          title: titleFromBranch(branch.name),
          storyPoints: 1,
          priority: StoryPriority.MEDIUM,
          status: StoryStatus.CODE,
          branch: branch.name,
          imported: true,
        });

        await this.commits.upsertMany(
          repository.id,
          story.id,
          commits.map((commit) => ({
            sha: commit.sha,
            message: commit.message,
            authorLogin: commit.authorLogin,
            authorName: commit.authorName,
            branch: branch.name,
            committedAt: commit.committedAt,
            url: commit.url,
          })),
        );

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
}
