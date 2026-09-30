import { OAuthProvider } from "../../../generated/prisma/client.js";
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
    const remoteCommits = await this.githubClient.listCommits(
      accessToken,
      repository.owner,
      repository.name,
      story.branch,
    );

    await this.commits.upsertMany(
      repository.id,
      story.id,
      remoteCommits.map((commit) => ({
        sha: commit.sha,
        message: commit.message,
        authorLogin: commit.authorLogin,
        authorName: commit.authorName,
        branch: story.branch,
        committedAt: commit.committedAt,
        url: commit.url,
      })),
    );

    await this.repositories.touchSynced(story.projectId, new Date());

    return { commitCount: remoteCommits.length };
  }
}
