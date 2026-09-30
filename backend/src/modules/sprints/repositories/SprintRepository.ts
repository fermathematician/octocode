import type { PrismaClient, Sprint } from "../../../generated/prisma/client.js";

export interface SprintRepository {
  findManyByOwner(ownerId: string, projectId?: string): Promise<Sprint[]>;
  findByIdForOwner(id: string, ownerId: string): Promise<Sprint | null>;
  findLatestByProject(projectId: string): Promise<Sprint | null>;
  create(data: {
    projectId: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }): Promise<Sprint>;
}

export class PrismaSprintRepository implements SprintRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findManyByOwner(ownerId: string, projectId?: string): Promise<Sprint[]> {
    return this.prisma.sprint.findMany({
      where: {
        project: { ownerId },
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { startDate: "desc" },
    });
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

  create(data: {
    projectId: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }): Promise<Sprint> {
    return this.prisma.sprint.create({ data });
  }
}
