import {
  StoryPriority,
  StoryStatus,
  type GithubRepository,
  type OAuthAccount,
  type OAuthProvider,
  type Project,
  type Sprint,
  type Story,
  type User,
} from "../../src/generated/prisma/client.js";
import type {
  OAuthAccountRecord,
  OAuthAccountRepository,
  SaveOAuthAccountData,
} from "../../src/modules/auth/repositories/OAuthAccountRepository.js";
import type {
  UserProfileData,
  UserRepository,
} from "../../src/modules/auth/repositories/UserRepository.js";
import type {
  GithubRepositoryRepository,
  SaveGithubRepositoryData,
} from "../../src/modules/github/repositories/GithubRepositoryRepository.js";
import type {
  CreateProjectData,
  ProjectRepository,
  ProjectWithRepository,
  UpdateProjectData,
} from "../../src/modules/projects/repositories/ProjectRepository.js";
import type {
  CreateSprintData,
  SprintRepository,
  UpdateSprintData,
} from "../../src/modules/sprints/repositories/SprintRepository.js";
import type {
  CreateStoryData,
  StoryFilters,
  StoryRepository,
  StoryWithCommits,
  UpdateStoryData,
} from "../../src/modules/stories/repositories/StoryRepository.js";
import {
  buildPage,
  type Paginated,
  type Pagination,
} from "../../src/shared/pagination.js";

export class InMemoryStore {
  users: User[] = [];
  projects: Project[] = [];
  sprints: Sprint[] = [];
  stories: Story[] = [];
  githubRepositories: GithubRepository[] = [];
  private sequence = 0;

  nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }

  seedUser(overrides: Partial<User> = {}): User {
    const now = new Date();
    const user: User = {
      id: this.nextId("user"),
      login: `user-${this.sequence}`,
      name: null,
      email: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
    this.users.push(user);
    return user;
  }

  seedProject(ownerId: string, overrides: Partial<Project> = {}): Project {
    const now = new Date();
    const project: Project = {
      id: this.nextId("project"),
      ownerId,
      name: "Project",
      color: "#000000",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
    this.projects.push(project);
    return project;
  }

  seedSprint(projectId: string, overrides: Partial<Sprint> = {}): Sprint {
    const now = new Date();
    const sprint: Sprint = {
      id: this.nextId("sprint"),
      projectId,
      name: "Sprint",
      startDate: now,
      endDate: now,
      createdAt: now,
      ...overrides,
    };
    this.sprints.push(sprint);
    return sprint;
  }

  seedStory(projectId: string, overrides: Partial<Story> = {}): Story {
    const now = new Date();
    const story: Story = {
      id: this.nextId("story"),
      projectId,
      sprintId: null,
      title: "Story",
      storyPoints: 3,
      priority: StoryPriority.MEDIUM,
      status: StoryStatus.BACKLOG,
      branch: `feat/story-${this.sequence}`,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      ...overrides,
    };
    this.stories.push(story);
    return story;
  }
}

export class InMemoryProjectRepository implements ProjectRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findManyByOwner(
    ownerId: string,
    pagination: Pagination,
  ): Promise<Paginated<ProjectWithRepository>> {
    const rows = this.store.projects
      .filter((project) => project.ownerId === ownerId)
      .map((project) => this.withRepository(project));

    return buildPage(rows, pagination.limit);
  }

  async findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<ProjectWithRepository | null> {
    const project = this.store.projects.find(
      (candidate) => candidate.id === id && candidate.ownerId === ownerId,
    );

    return project ? this.withRepository(project) : null;
  }

  async create(data: CreateProjectData): Promise<ProjectWithRepository> {
    const now = new Date();
    const project: Project = {
      id: this.store.nextId("project"),
      ownerId: data.ownerId,
      name: data.name,
      color: data.color,
      createdAt: now,
      updatedAt: now,
    };
    this.store.projects.push(project);
    return this.withRepository(project);
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdateProjectData,
  ): Promise<ProjectWithRepository | null> {
    const project = this.store.projects.find(
      (candidate) => candidate.id === id && candidate.ownerId === ownerId,
    );

    if (!project) {
      return null;
    }

    if (data.name !== undefined) {
      project.name = data.name;
    }

    if (data.color !== undefined) {
      project.color = data.color;
    }

    project.updatedAt = new Date();
    return this.withRepository(project);
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const index = this.store.projects.findIndex(
      (candidate) => candidate.id === id && candidate.ownerId === ownerId,
    );

    if (index === -1) {
      return false;
    }

    this.store.projects.splice(index, 1);
    return true;
  }

  private withRepository(project: Project): ProjectWithRepository {
    return {
      ...project,
      repository:
        this.store.githubRepositories.find(
          (repository) => repository.projectId === project.id,
        ) ?? null,
    };
  }
}

export class InMemorySprintRepository implements SprintRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findManyByOwner(
    ownerId: string,
    projectId: string | undefined,
    pagination: Pagination,
  ): Promise<Paginated<Sprint>> {
    const rows = this.store.sprints
      .filter((sprint) => {
        if (projectId && sprint.projectId !== projectId) {
          return false;
        }

        return this.ownsProject(sprint.projectId, ownerId);
      })
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return buildPage(rows, pagination.limit);
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Sprint | null> {
    const sprint = this.store.sprints.find((candidate) => candidate.id === id);

    if (!sprint || !this.ownsProject(sprint.projectId, ownerId)) {
      return null;
    }

    return sprint;
  }

  async findLatestByProject(projectId: string): Promise<Sprint | null> {
    const rows = this.store.sprints
      .filter((sprint) => sprint.projectId === projectId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return rows[0] ?? null;
  }

  async create(data: CreateSprintData): Promise<Sprint> {
    const sprint: Sprint = {
      id: this.store.nextId("sprint"),
      projectId: data.projectId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date(),
    };
    this.store.sprints.push(sprint);
    return sprint;
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdateSprintData,
  ): Promise<Sprint | null> {
    const sprint = await this.findByIdForOwner(id, ownerId);

    if (!sprint) {
      return null;
    }

    if (data.name !== undefined) {
      sprint.name = data.name;
    }

    if (data.startDate !== undefined) {
      sprint.startDate = data.startDate;
    }

    if (data.endDate !== undefined) {
      sprint.endDate = data.endDate;
    }

    return sprint;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const sprint = await this.findByIdForOwner(id, ownerId);

    if (!sprint) {
      return false;
    }

    this.store.sprints = this.store.sprints.filter(
      (candidate) => candidate.id !== id,
    );
    return true;
  }

  private ownsProject(projectId: string, ownerId: string): boolean {
    return (
      this.store.projects.find((project) => project.id === projectId)
        ?.ownerId === ownerId
    );
  }
}

export class InMemoryStoryRepository implements StoryRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findManyByOwner(
    ownerId: string,
    filters: StoryFilters,
    pagination: Pagination,
  ): Promise<Paginated<StoryWithCommits>> {
    const rows = this.store.stories
      .filter((story) => this.matches(story, ownerId, filters))
      .map((story) => this.withCommits(story));

    return buildPage(rows, pagination.limit);
  }

  async findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<StoryWithCommits | null> {
    const story = this.store.stories.find((candidate) => candidate.id === id);

    if (!story || !this.ownsProject(story.projectId, ownerId)) {
      return null;
    }

    return this.withCommits(story);
  }

  async create(data: CreateStoryData): Promise<StoryWithCommits> {
    const now = new Date();
    const story: Story = {
      id: this.store.nextId("story"),
      projectId: data.projectId,
      sprintId: data.sprintId,
      title: data.title,
      storyPoints: data.storyPoints,
      priority: data.priority,
      status: StoryStatus.BACKLOG,
      branch: data.branch,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.store.stories.push(story);
    return this.withCommits(story);
  }

  async update(id: string, data: UpdateStoryData): Promise<StoryWithCommits> {
    const story = this.require(id);

    if (data.title !== undefined) {
      story.title = data.title;
    }

    if (data.storyPoints !== undefined) {
      story.storyPoints = data.storyPoints;
    }

    if (data.priority !== undefined) {
      story.priority = data.priority;
    }

    story.updatedAt = new Date();
    return this.withCommits(story);
  }

  async updateStatus(
    id: string,
    status: StoryStatus,
    completedAt: Date | null,
  ): Promise<StoryWithCommits> {
    const story = this.require(id);
    story.status = status;
    story.completedAt = completedAt;
    story.updatedAt = new Date();
    return this.withCommits(story);
  }

  async updateBranch(id: string, branch: string): Promise<StoryWithCommits> {
    const story = this.require(id);
    story.branch = branch;
    story.updatedAt = new Date();
    return this.withCommits(story);
  }

  async moveToSprint(
    id: string,
    sprintId: string | null,
  ): Promise<StoryWithCommits> {
    const story = this.require(id);
    story.sprintId = sprintId;
    story.updatedAt = new Date();
    return this.withCommits(story);
  }

  async findBranchesByProject(projectId: string): Promise<string[]> {
    return this.store.stories
      .filter((story) => story.projectId === projectId)
      .map((story) => story.branch);
  }

  private require(id: string): Story {
    const story = this.store.stories.find((candidate) => candidate.id === id);

    if (!story) {
      throw new Error(`Story ${id} not found`);
    }

    return story;
  }

  private ownsProject(projectId: string, ownerId: string): boolean {
    return (
      this.store.projects.find((project) => project.id === projectId)
        ?.ownerId === ownerId
    );
  }

  private matches(
    story: Story,
    ownerId: string,
    filters: StoryFilters,
  ): boolean {
    if (!this.ownsProject(story.projectId, ownerId)) {
      return false;
    }

    if (filters.projectId && story.projectId !== filters.projectId) {
      return false;
    }

    if (filters.status && story.status !== filters.status) {
      return false;
    }

    if (filters.priority && story.priority !== filters.priority) {
      return false;
    }

    return true;
  }

  private withCommits(story: Story): StoryWithCommits {
    return { ...story, commits: [] };
  }
}

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findById(id: string): Promise<User | null> {
    return this.store.users.find((user) => user.id === id) ?? null;
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.store.users.find((user) => user.login === login) ?? null;
  }

  async create(data: UserProfileData): Promise<User> {
    const now = new Date();
    const user: User = {
      id: this.store.nextId("user"),
      login: data.login,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
      createdAt: now,
      updatedAt: now,
    };
    this.store.users.push(user);
    return user;
  }

  async updateProfile(id: string, data: UserProfileData): Promise<User> {
    const user = this.store.users.find((candidate) => candidate.id === id);

    if (!user) {
      throw new Error(`User ${id} not found`);
    }

    user.login = data.login;
    user.name = data.name;
    user.email = data.email;
    user.avatarUrl = data.avatarUrl;
    user.updatedAt = new Date();
    return user;
  }
}

export class InMemoryGithubRepositoryRepository
  implements GithubRepositoryRepository
{
  constructor(private readonly store: InMemoryStore) {}

  async findByProject(projectId: string): Promise<GithubRepository | null> {
    return (
      this.store.githubRepositories.find(
        (repository) => repository.projectId === projectId,
      ) ?? null
    );
  }

  async save(data: SaveGithubRepositoryData): Promise<GithubRepository> {
    const existing = await this.findByProject(data.projectId);
    const now = new Date();

    if (existing) {
      existing.repoId = data.repoId;
      existing.owner = data.owner;
      existing.name = data.name;
      existing.defaultBranch = data.defaultBranch;
      existing.isPrivate = data.isPrivate;
      existing.installationId = data.installationId;
      existing.updatedAt = now;
      return existing;
    }

    const repository: GithubRepository = {
      id: this.store.nextId("repo"),
      projectId: data.projectId,
      repoId: data.repoId,
      owner: data.owner,
      name: data.name,
      defaultBranch: data.defaultBranch,
      isPrivate: data.isPrivate,
      installationId: data.installationId,
      lastSyncedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.githubRepositories.push(repository);
    return repository;
  }

  async deleteByProject(projectId: string): Promise<void> {
    this.store.githubRepositories = this.store.githubRepositories.filter(
      (repository) => repository.projectId !== projectId,
    );
  }

  async touchSynced(projectId: string, syncedAt: Date): Promise<void> {
    const repository = await this.findByProject(projectId);

    if (repository) {
      repository.lastSyncedAt = syncedAt;
    }
  }
}

export class InMemoryOAuthAccountRepository
  implements OAuthAccountRepository
{
  private accounts: Array<SaveOAuthAccountData & { id: string }> = [];

  async findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccountRecord | null> {
    const found = this.accounts.find(
      (account) =>
        account.provider === provider &&
        account.providerAccountId === providerAccountId,
    );

    return found ? toRecord(found) : null;
  }

  async findByUser(
    userId: string,
    provider: OAuthProvider,
  ): Promise<OAuthAccountRecord | null> {
    const found = this.accounts.find(
      (account) => account.userId === userId && account.provider === provider,
    );

    return found ? toRecord(found) : null;
  }

  async save(data: SaveOAuthAccountData): Promise<OAuthAccount> {
    const existing = this.accounts.find(
      (account) =>
        account.provider === data.provider &&
        account.providerAccountId === data.providerAccountId,
    );

    if (existing) {
      Object.assign(existing, data);
      return toModel(existing);
    }

    const stored = { id: `oauth-${this.accounts.length + 1}`, ...data };
    this.accounts.push(stored);
    return toModel(stored);
  }
}

function toRecord(
  account: SaveOAuthAccountData & { id: string },
): OAuthAccountRecord {
  return {
    id: account.id,
    userId: account.userId,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    expiresAt: account.expiresAt,
  };
}

function toModel(account: SaveOAuthAccountData & { id: string }): OAuthAccount {
  const now = new Date();

  return {
    ...toRecord(account),
    tokenType: account.tokenType,
    scope: account.scope,
    createdAt: now,
    updatedAt: now,
  };
}
