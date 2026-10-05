import type { PrismaClient } from "../../../generated/prisma/client.js";

export interface UpsertCommitData {
  sha: string;
  message: string;
  authorLogin: string | null;
  authorName: string | null;
  committedAt: Date;
  url: string | null;
}

export interface CommitRepository {
  /**
   * Replaces the commits of one story with the given list. The whole story is
   * cleared first, so a story never keeps commits from a previous branch.
   * Commits are keyed per branch, so the same commit on two branches is two
   * rows and never leaks between cards.
   */
  replaceForStory(
    repositoryId: string,
    storyId: string,
    branch: string,
    commits: UpsertCommitData[],
  ): Promise<void>;
  countByStory(storyId: string): Promise<number>;
}

export class PrismaCommitRepository implements CommitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async replaceForStory(
    repositoryId: string,
    storyId: string,
    branch: string,
    commits: UpsertCommitData[],
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.commit.deleteMany({ where: { storyId } });

      for (const commit of commits) {
        await transaction.commit.upsert({
          where: {
            repositoryId_branch_sha: {
              repositoryId,
              branch,
              sha: commit.sha,
            },
          },
          create: {
            repositoryId,
            storyId,
            branch,
            sha: commit.sha,
            message: commit.message,
            authorLogin: commit.authorLogin,
            authorName: commit.authorName,
            committedAt: commit.committedAt,
            url: commit.url,
          },
          update: {
            storyId,
            message: commit.message,
            authorLogin: commit.authorLogin,
            authorName: commit.authorName,
            committedAt: commit.committedAt,
            url: commit.url,
          },
        });
      }
    });
  }

  countByStory(storyId: string): Promise<number> {
    return this.prisma.commit.count({ where: { storyId } });
  }
}
