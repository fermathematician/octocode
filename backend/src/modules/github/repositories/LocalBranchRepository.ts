import type {
  LocalBranch,
  PrismaClient,
} from "../../../generated/prisma/client.js";

export interface LocalBranchRepository {
  listByProject(projectId: string): Promise<LocalBranch[]>;
  /**
   * Replaces the stored set with `names`. The local git hook always reports the
   * complete list of local branches, so anything missing has been deleted and is
   * dropped here.
   */
  replaceAll(projectId: string, names: string[]): Promise<string[]>;
  deleteByProject(projectId: string): Promise<void>;
}

export class PrismaLocalBranchRepository implements LocalBranchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listByProject(projectId: string): Promise<LocalBranch[]> {
    return this.prisma.localBranch.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });
  }

  async replaceAll(projectId: string, names: string[]): Promise<string[]> {
    const unique = [...new Set(names)];

    if (unique.length === 0) {
      await this.deleteByProject(projectId);
      return [];
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.localBranch.deleteMany({
        where: { projectId, name: { notIn: unique } },
      });

      for (const name of unique) {
        await transaction.localBranch.upsert({
          where: { projectId_name: { projectId, name } },
          create: { projectId, name },
          update: { name },
        });
      }
    });

    return unique;
  }

  async deleteByProject(projectId: string): Promise<void> {
    await this.prisma.localBranch.deleteMany({ where: { projectId } });
  }
}
