import type {
  GithubRepository,
  PrismaClient,
  Project,
} from "../../../generated/prisma/client.js";
import {
  buildPage,
  type Paginated,
  type Pagination,
} from "../../../shared/pagination.js";

export type ProjectWithRepository = Project & {
  repository: GithubRepository | null;
};

export interface UpdateProjectData {
  name?: string;
  color?: string;
}

export interface CreateProjectData {
  ownerId: string;
  name: string;
  color: string;
}

export interface ProjectRepository {
  findManyByOwner(
    ownerId: string,
    pagination: Pagination,
  ): Promise<Paginated<ProjectWithRepository>>;
  findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<ProjectWithRepository | null>;
  create(data: CreateProjectData): Promise<ProjectWithRepository>;
  update(
    id: string,
    ownerId: string,
    data: UpdateProjectData,
  ): Promise<ProjectWithRepository | null>;
  delete(id: string, ownerId: string): Promise<boolean>;
}

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByOwner(
    ownerId: string,
    pagination: Pagination,
  ): Promise<Paginated<ProjectWithRepository>> {
    const rows = await this.prisma.project.findMany({
      where: { ownerId },
      include: { repository: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: pagination.limit + 1,
      ...(pagination.cursor
        ? { cursor: { id: pagination.cursor }, skip: 1 }
        : {}),
    });

    return buildPage(rows, pagination.limit);
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

  create(data: CreateProjectData): Promise<ProjectWithRepository> {
    return this.prisma.project.create({
      data,
      include: { repository: true },
    });
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdateProjectData,
  ): Promise<ProjectWithRepository | null> {
    const result = await this.prisma.project.updateMany({
      where: { id, ownerId },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForOwner(id, ownerId);
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const result = await this.prisma.project.deleteMany({
      where: { id, ownerId },
    });

    return result.count > 0;
  }
}
