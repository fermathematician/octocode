import { OAuthProvider } from "../../../generated/prisma/client.js";
import type { GithubRepository } from "../../../generated/prisma/client.js";
import type { TokenCipher } from "../../../infrastructure/auth/TokenCipher.js";
import type {
  GithubClient,
  GithubCommitSummary,
} from "../../../infrastructure/github/GithubClient.js";
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
    const remoteCommits = await this.listBranchCommits(
      accessToken,
      repository,
      story.branch,
    );

    await this.commits.replaceForStory(
      repository.id,
      story.id,
      story.branch,
      remoteCommits.map((commit) => ({
        sha: commit.sha,
        message: commit.message,
        authorLogin: commit.authorLogin,
        authorName: commit.authorName,
        committedAt: commit.committedAt,
        url: commit.url,
      })),
    );

    await this.repositories.touchSynced(story.projectId, new Date());

    return { commitCount: remoteCommits.length };
  }

  /**
   * Returns only the commits that belong to the story's branch: the commits on
   * the branch that are not already on the repository's default branch. When the
   * story's branch *is* the default branch, all of its commits are returned. A
   * branch that does not exist on GitHub (never pushed / deleted) yields none.
   */
  private async listBranchCommits(
    accessToken: string,
    repository: GithubRepository,
    branch: string,
  ): Promise<GithubCommitSummary[]> {
    if (branch === repository.defaultBranch) {
      return this.githubClient.listCommits(
        accessToken,
        repository.owner,
        repository.name,
        branch,
      );
    }

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
      // The branch does not exist on GitHub (never pushed / deleted): no commits.
      if (error instanceof AppError && error.statusCode === 404) {
        return [];
      }

      throw error;
    }
  }
}
