import type {
  Commit,
  PrismaClient,
  Story,
  StoryPriority,
  StoryStatus,
} from "../../../generated/prisma/client.js";
import {
  buildPage,
  type Paginated,
  type Pagination,
} from "../../../shared/pagination.js";

export type StoryWithCommits = Story & { commits: Commit[] };

export interface StoryFilters {
  projectId?: string;
  status?: StoryStatus;
  priority?: StoryPriority;
}

export interface CreateStoryData {
  projectId: string;
  sprintId: string | null;
  title: string;
  storyPoints: number;
  priority: StoryPriority;
  branch: string;
  status?: StoryStatus;
  imported?: boolean;
}

export interface UpdateStoryData {
  title?: string;
  storyPoints?: number;
  priority?: StoryPriority;
}

export interface StoryRepository {
  findManyByOwner(
    ownerId: string,
    filters: StoryFilters,
    pagination: Pagination,
  ): Promise<Paginated<StoryWithCommits>>;
  findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<StoryWithCommits | null>;
  create(data: CreateStoryData): Promise<StoryWithCommits>;
  update(id: string, data: UpdateStoryData): Promise<StoryWithCommits>;
  updateStatus(
    id: string,
    status: StoryStatus,
    completedAt: Date | null,
  ): Promise<StoryWithCommits>;
  updateBranch(id: string, branch: string): Promise<StoryWithCommits>;
  moveToSprint(id: string, sprintId: string | null): Promise<StoryWithCommits>;
  findBranchesByProject(projectId: string): Promise<string[]>;
  findIdsByProject(projectId: string): Promise<string[]>;
}

const include = { commits: { orderBy: { committedAt: "desc" as const } } };

export class PrismaStoryRepository implements StoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyByOwner(
    ownerId: string,
    filters: StoryFilters,
    pagination: Pagination,
  ): Promise<Paginated<StoryWithCommits>> {
    const rows = await this.prisma.story.findMany({
      where: {
        project: { ownerId },
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
      },
      include,
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
  ): Promise<StoryWithCommits | null> {
    return this.prisma.story.findFirst({
      where: { id, project: { ownerId } },
      include,
    });
  }

  create(data: CreateStoryData): Promise<StoryWithCommits> {
    return this.prisma.story.create({ data, include });
  }

  update(id: string, data: UpdateStoryData): Promise<StoryWithCommits> {
    return this.prisma.story.update({ where: { id }, data, include });
  }

  updateStatus(
    id: string,
    status: StoryStatus,
    completedAt: Date | null,
  ): Promise<StoryWithCommits> {
    return this.prisma.story.update({
      where: { id },
      data: { status, completedAt },
      include,
    });
  }

  updateBranch(id: string, branch: string): Promise<StoryWithCommits> {
    return this.prisma.story.update({
      where: { id },
      data: { branch },
      include,
    });
  }

  moveToSprint(
    id: string,
    sprintId: string | null,
  ): Promise<StoryWithCommits> {
    return this.prisma.story.update({
      where: { id },
      data: { sprintId },
      include,
    });
  }

  async findBranchesByProject(projectId: string): Promise<string[]> {
    const stories = await this.prisma.story.findMany({
      where: { projectId },
      select: { branch: true },
    });

    return stories.map((story) => story.branch);
  }

  async findIdsByProject(projectId: string): Promise<string[]> {
    const stories = await this.prisma.story.findMany({
      where: { projectId },
      select: { id: true },
    });

    return stories.map((story) => story.id);
  }
}
