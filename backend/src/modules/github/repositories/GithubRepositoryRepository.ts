import type {
  GithubRepository,
  PrismaClient,
} from "../../../generated/prisma/client.js";

export interface SaveGithubRepositoryData {
  projectId: string;
  userId: string;
  repoId: string;
  owner: string;
  name: string;
  defaultBranch: string;
  isPrivate: boolean;
  installationId: string | null;
}

export interface GithubRepositoryRepository {
  findByProject(projectId: string): Promise<GithubRepository | null>;
  save(data: SaveGithubRepositoryData): Promise<GithubRepository>;
  deleteByProject(projectId: string): Promise<void>;
  touchSynced(projectId: string, syncedAt: Date): Promise<void>;
}

export class PrismaGithubRepositoryRepository
  implements GithubRepositoryRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  findByProject(projectId: string): Promise<GithubRepository | null> {
    return this.prisma.githubRepository.findUnique({ where: { projectId } });
  }

  save(data: SaveGithubRepositoryData): Promise<GithubRepository> {
    return this.prisma.githubRepository.upsert({
      where: { projectId: data.projectId },
      create: data,
      update: {
        repoId: data.repoId,
        owner: data.owner,
        name: data.name,
        defaultBranch: data.defaultBranch,
        isPrivate: data.isPrivate,
        installationId: data.installationId,
      },
    });
  }

  async deleteByProject(projectId: string): Promise<void> {
    await this.prisma.githubRepository.deleteMany({ where: { projectId } });
  }

  async touchSynced(projectId: string, syncedAt: Date): Promise<void> {
    await this.prisma.githubRepository.update({
      where: { projectId },
      data: { lastSyncedAt: syncedAt },
    });
  }
}
