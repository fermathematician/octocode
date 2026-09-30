import type { PrismaClient } from "../../../generated/prisma/client.js";

export interface UpsertCommitData {
  sha: string;
  message: string;
  authorLogin: string | null;
  authorName: string | null;
  branch: string;
  committedAt: Date;
  url: string | null;
}

export interface CommitRepository {
  upsertMany(
    repositoryId: string,
    storyId: string,
    commits: UpsertCommitData[],
  ): Promise<void>;
  countByStory(storyId: string): Promise<number>;
}

export class PrismaCommitRepository implements CommitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertMany(
    repositoryId: string,
    storyId: string,
    commits: UpsertCommitData[],
  ): Promise<void> {
    await this.prisma.$transaction(
      commits.map((commit) =>
        this.prisma.commit.upsert({
          where: {
            repositoryId_sha: { repositoryId, sha: commit.sha },
          },
          create: {
            repositoryId,
            storyId,
            sha: commit.sha,
            message: commit.message,
            authorLogin: commit.authorLogin,
            authorName: commit.authorName,
            branch: commit.branch,
            committedAt: commit.committedAt,
            url: commit.url,
          },
          update: {
            storyId,
            message: commit.message,
            authorLogin: commit.authorLogin,
            authorName: commit.authorName,
            branch: commit.branch,
            committedAt: commit.committedAt,
            url: commit.url,
          },
        }),
      ),
    );
  }

  countByStory(storyId: string): Promise<number> {
    return this.prisma.commit.count({ where: { storyId } });
  }
}
