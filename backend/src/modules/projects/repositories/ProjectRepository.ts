import type {
  GithubRepository,
  PrismaClient,
  Project,
} from "../../../generated/prisma/client.js";

export type ProjectWithRepository = Project & {
  repository: GithubRepository | null;
};

export interface ProjectRepository {
  findManyByOwner(ownerId: string): Promise<ProjectWithRepository[]>;
  findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<ProjectWithRepository | null>;
  create(data: {
    ownerId: string;
    name: string;
    color: string;
  }): Promise<ProjectWithRepository>;
}

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyByOwner(ownerId: string): Promise<ProjectWithRepository[]> {
    return this.prisma.project.findMany({
      where: { ownerId },
      include: { repository: true },
      orderBy: { createdAt: "asc" },
    });
  }

  findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<ProjectWithRepository | null> {
    return this.prisma.project.findFirst({
      where: { id, ownerId },
      include: { repository: true },
    });
  }

  create(data: {
    ownerId: string;
    name: string;
    color: string;
  }): Promise<ProjectWithRepository> {
    return this.prisma.project.create({
      data,
      include: { repository: true },
    });
  }
}
