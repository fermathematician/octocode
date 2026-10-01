import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { GithubRepository } from "../../../generated/prisma/client.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../../infrastructure/github/GithubClient.js";
import { AppError } from "../../../shared/appError.js";
import type { OAuthAccountRepository } from "../../auth/repositories/OAuthAccountRepository.js";
import type { StoryRepository } from "../../stories/repositories/StoryRepository.js";
import type { CommitRepository } from "../repositories/CommitRepository.js";
import type { GithubRepositoryRepository } from "../repositories/GithubRepositoryRepository.js";

export interface SyncStoryCommitsResult {
  commitCount: number;
}

export class SyncStoryCommitsService {
  constructor(
    private readonly stories: StoryRepository,
    private readonly repositories: GithubRepositoryRepository,
    private readonly commits: CommitRepository,
    private readonly oauthAccounts: OAuthAccountRepository,
    private readonly tokenCipher: TokenCipher,
    private readonly githubClient: GithubClient,
  ) {}

  async execute(
    ownerId: string,
    storyId: string,
  ): Promise<SyncStoryCommitsResult> {
    const story = await this.stories.findByIdForOwner(storyId, ownerId);

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    const repository = await this.repositories.findByProject(story.projectId);

    if (!repository) {
      throw new AppError("Project has no linked GitHub repository.", 400);
    }

    const account = await this.oauthAccounts.findByUser(
      ownerId,
      OAuthProvider.GITHUB,
    );

    if (!account) {
      throw new AppError("GitHub account is not connected.", 400);
    }

    const accessToken = this.tokenCipher.decrypt(account.accessToken);
    const branch = await this.resolveCommitBranch(
      accessToken,
      repository,
      story.branch,
    );

    const remoteCommits = await this.githubClient.listCommits(
      accessToken,
      repository.owner,
      repository.name,
      branch,
    );

    await this.commits.upsertMany(
      repository.id,
      story.id,
      remoteCommits.map((commit) => ({
        sha: commit.sha,
        message: commit.message,
        authorLogin: commit.authorLogin,
        authorName: commit.authorName,
        branch,
        committedAt: commit.committedAt,
        url: commit.url,
      })),
    );

    await this.repositories.touchSynced(story.projectId, new Date());

    return { commitCount: remoteCommits.length };
  }

  /**
   * Picks which branch to read commits from. When the story's branch has been
   * fully merged into the default branch (or was never pushed), the work lives
   * on the default branch, so use that instead.
   */
  private async resolveCommitBranch(
    accessToken: string,
    repository: GithubRepository,
    storyBranch: string,
  ): Promise<string> {
    if (storyBranch === repository.defaultBranch) {
      return storyBranch;
    }

    try {
      const comparison = await this.githubClient.compareBranches(
        accessToken,
        repository.owner,
        repository.name,
        storyBranch,
        repository.defaultBranch,
      );

      // behindBy = story commits not in the default branch; aheadBy = default
      // commits not in the story branch. behindBy 0 means the branch is fully
      // contained in the default branch (merged / stale).
      const isFullyMerged = comparison.behindBy === 0 && comparison.aheadBy > 0;

      return isFullyMerged ? repository.defaultBranch : storyBranch;
    } catch (error) {
      // The branch does not exist on GitHub (never pushed): use the default.
      if (error instanceof AppError && error.statusCode === 404) {
        return repository.defaultBranch;
      }

      throw error;
    }
  }
}
