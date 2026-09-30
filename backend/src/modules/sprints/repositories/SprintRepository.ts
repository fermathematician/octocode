import type { PrismaClient, Sprint } from "../../../generated/prisma/client.js";
import {
  buildPage,
  type Paginated,
  type Pagination,
} from "../../../shared/pagination.js";

export interface CreateSprintData {
  projectId: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateSprintData {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface SprintRepository {
  findManyByOwner(
    ownerId: string,
    projectId: string | undefined,
    pagination: Pagination,
  ): Promise<Paginated<Sprint>>;
  findByIdForOwner(id: string, ownerId: string): Promise<Sprint | null>;
  findLatestByProject(projectId: string): Promise<Sprint | null>;
  create(data: CreateSprintData): Promise<Sprint>;
  update(
    id: string,
    ownerId: string,
    data: UpdateSprintData,
  ): Promise<Sprint | null>;
  delete(id: string, ownerId: string): Promise<boolean>;
}

export class PrismaSprintRepository implements SprintRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByOwner(
    ownerId: string,
    projectId: string | undefined,
    pagination: Pagination,
  ): Promise<Paginated<Sprint>> {
    const rows = await this.prisma.sprint.findMany({
      where: {
        project: { ownerId },
        ...(projectId ? { projectId } : {}),
      },
      orderBy: [{ startDate: "desc" }, { id: "asc" }],
      take: pagination.limit + 1,
      ...(pagination.cursor
        ? { cursor: { id: pagination.cursor }, skip: 1 }
        : {}),
    });

    return buildPage(rows, pagination.limit);
  }

  findByIdForOwner(id: string, ownerId: string): Promise<Sprint | null> {
    return this.prisma.sprint.findFirst({
      where: { id, project: { ownerId } },
    });
  }

  findLatestByProject(projectId: string): Promise<Sprint | null> {
    return this.prisma.sprint.findFirst({
      where: { projectId },
      orderBy: { startDate: "desc" },
    });
  }

  create(data: CreateSprintData): Promise<Sprint> {
    return this.prisma.sprint.create({ data });
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdateSprintData,
  ): Promise<Sprint | null> {
    const result = await this.prisma.sprint.updateMany({
      where: { id, project: { ownerId } },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForOwner(id, ownerId);
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const result = await this.prisma.sprint.deleteMany({
      where: { id, project: { ownerId } },
    });

    return result.count > 0;
  }
}
