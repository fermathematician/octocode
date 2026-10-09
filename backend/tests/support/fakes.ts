import {
  CalendarEventSource,
  CalendarEventType,
  StoryPriority,
  StoryStatus,
  type CalendarEvent,
  type CalendarSyncState,
  type GithubRepository,
  type LocalBranch,
  type OAuthAccount,
  type OAuthProvider,
  type Project,
  type Sprint,
  type Story,
  type User,
} from "../../src/generated/prisma/client.js";
import type {
  CalendarEventRepository,
  CreateCalendarEventData,
  UpdateCalendarEventData,
  UpsertExternalCalendarEventData,
} from "../../src/modules/calendar/repositories/CalendarEventRepository.js";
import type {
  CalendarSyncStateRepository,
  SaveCalendarSyncStateData,
} from "../../src/modules/calendar/repositories/CalendarSyncStateRepository.js";
import type {
  OAuthAccountRecord,
  OAuthAccountRepository,
  SaveOAuthAccountData,
  UpdateOAuthTokensData,
} from "../../src/modules/auth/repositories/OAuthAccountRepository.js";
import type {
  UserProfileData,
  UserRepository,
} from "../../src/modules/auth/repositories/UserRepository.js";
import type {
  GithubRepositoryRepository,
  SaveGithubRepositoryData,
} from "../../src/modules/github/repositories/GithubRepositoryRepository.js";
import type { LocalBranchRepository } from "../../src/modules/github/repositories/LocalBranchRepository.js";
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
  localBranches: LocalBranch[] = [];
  calendarEvents: CalendarEvent[] = [];
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

  seedSprint(ownerId: string, overrides: Partial<Sprint> = {}): Sprint {
    const now = new Date();
    const sprint: Sprint = {
      id: this.nextId("sprint"),
      ownerId,
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
      imported: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      ...overrides,
    };
    this.stories.push(story);
    return story;
  }

  seedCalendarEvent(
    userId: string,
    overrides: Partial<CalendarEvent> = {},
  ): CalendarEvent {
    const now = new Date();
    const event: CalendarEvent = {
      id: this.nextId("event"),
      userId,
      type: CalendarEventType.TASK,
      title: "Event",
      date: now,
      startTime: "09:00",
      notes: "",
      completed: false,
      source: CalendarEventSource.LOCAL,
      externalId: null,
      externalUpdatedAt: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
    this.calendarEvents.push(event);
    return event;
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
    pagination: Pagination,
  ): Promise<Paginated<Sprint>> {
    const rows = this.store.sprints
      .filter((sprint) => sprint.ownerId === ownerId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return buildPage(rows, pagination.limit);
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Sprint | null> {
    const sprint = this.store.sprints.find(
      (candidate) => candidate.id === id && candidate.ownerId === ownerId,
    );

    return sprint ?? null;
  }

  async findLatestByOwner(ownerId: string): Promise<Sprint | null> {
    const rows = this.store.sprints
      .filter((sprint) => sprint.ownerId === ownerId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return rows[0] ?? null;
  }

  async create(data: CreateSprintData): Promise<Sprint> {
    const sprint: Sprint = {
      id: this.store.nextId("sprint"),
      ownerId: data.ownerId,
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
      status: data.status ?? StoryStatus.BACKLOG,
      branch: data.branch,
      imported: data.imported ?? false,
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

  async delete(id: string, ownerId: string): Promise<boolean> {
    const story = this.store.stories.find((candidate) => candidate.id === id);

    if (!story || !this.ownsProject(story.projectId, ownerId)) {
      return false;
    }

    this.store.stories = this.store.stories.filter(
      (candidate) => candidate.id !== id,
    );
    return true;
  }

  async findIdsByProject(projectId: string): Promise<string[]> {
    return this.store.stories
      .filter((story) => story.projectId === projectId)
      .map((story) => story.id);
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

  async findAll(): Promise<GithubRepository[]> {
    return [...this.store.githubRepositories];
  }

  async findAllByUser(userId: string): Promise<GithubRepository[]> {
    return this.store.githubRepositories.filter(
      (repository) => repository.userId === userId,
    );
  }

  async findAllByOwnerAndName(
    owner: string,
    name: string,
  ): Promise<GithubRepository[]> {
    return this.store.githubRepositories.filter(
      (repository) => repository.owner === owner && repository.name === name,
    );
  }

  findByUserAndOwnerAndName(
    userId: string,
    owner: string,
    name: string,
  ): Promise<GithubRepository | null> {
    return Promise.resolve(
      this.store.githubRepositories.find(
        (repository) =>
          repository.userId === userId &&
          repository.owner === owner &&
          repository.name === name,
      ) ?? null,
    );
  }

  async save(data: SaveGithubRepositoryData): Promise<GithubRepository> {
    const existing = await this.findByProject(data.projectId);
    const now = new Date();

    if (existing) {
      existing.userId = data.userId;
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
      userId: data.userId,
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

export class InMemoryLocalBranchRepository implements LocalBranchRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listByProject(projectId: string): Promise<LocalBranch[]> {
    return this.store.localBranches.filter(
      (branch) => branch.projectId === projectId,
    );
  }

  async replaceAll(projectId: string, names: string[]): Promise<string[]> {
    const unique = [...new Set(names)];
    const now = new Date();

    this.store.localBranches = this.store.localBranches.filter(
      (branch) =>
        branch.projectId !== projectId || unique.includes(branch.name),
    );

    for (const name of unique) {
      const existing = this.store.localBranches.find(
        (branch) => branch.projectId === projectId && branch.name === name,
      );

      if (existing) {
        existing.updatedAt = now;
        continue;
      }

      this.store.localBranches.push({
        id: this.store.nextId("branch"),
        projectId,
        name,
        createdAt: now,
        updatedAt: now,
      });
    }

    return unique;
  }

  async deleteByProject(projectId: string): Promise<void> {
    this.store.localBranches = this.store.localBranches.filter(
      (branch) => branch.projectId !== projectId,
    );
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

  async updateTokens(
    id: string,
    data: UpdateOAuthTokensData,
  ): Promise<void> {
    const account = this.accounts.find((candidate) => candidate.id === id);

    if (!account) {
      return;
    }

    account.accessToken = data.accessToken;
    account.refreshToken = data.refreshToken;
    account.tokenType = data.tokenType;
    account.expiresAt = data.expiresAt;
  }

  async deleteByUser(userId: string, provider: OAuthProvider): Promise<void> {
    this.accounts = this.accounts.filter(
      (account) =>
        !(account.userId === userId && account.provider === provider),
    );
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

export class InMemoryCalendarEventRepository
  implements CalendarEventRepository
{
  constructor(private readonly store: InMemoryStore) {}

  async findManyByUser(
    userId: string,
    date: Date | undefined,
    pagination: Pagination,
  ): Promise<Paginated<CalendarEvent>> {
    const rows = this.store.calendarEvents.filter(
      (event) =>
        event.userId === userId &&
        (!date || event.date.getTime() === date.getTime()),
    );

    return buildPage(rows, pagination.limit);
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<CalendarEvent | null> {
    return (
      this.store.calendarEvents.find(
        (event) => event.id === id && event.userId === userId,
      ) ?? null
    );
  }

  async findByExternalId(
    userId: string,
    externalId: string,
  ): Promise<CalendarEvent | null> {
    return (
      this.store.calendarEvents.find(
        (event) =>
          event.userId === userId && event.externalId === externalId,
      ) ?? null
    );
  }

  async findLocalWithoutExternalId(userId: string): Promise<CalendarEvent[]> {
    return this.store.calendarEvents.filter(
      (event) =>
        event.userId === userId &&
        event.source === CalendarEventSource.LOCAL &&
        event.externalId === null,
    );
  }

  async create(data: CreateCalendarEventData): Promise<CalendarEvent> {
    const now = new Date();
    const event: CalendarEvent = {
      id: this.store.nextId("event"),
      userId: data.userId,
      type: data.type,
      title: data.title,
      date: data.date,
      startTime: data.startTime,
      notes: "",
      completed: false,
      source: CalendarEventSource.LOCAL,
      externalId: null,
      externalUpdatedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.calendarEvents.push(event);
    return event;
  }

  async upsertByExternalId(
    userId: string,
    externalId: string,
    data: UpsertExternalCalendarEventData,
  ): Promise<CalendarEvent> {
    const existing = await this.findByExternalId(userId, externalId);

    if (existing) {
      existing.type = data.type;
      existing.title = data.title;
      existing.date = data.date;
      existing.startTime = data.startTime;
      existing.notes = data.notes;
      existing.externalUpdatedAt = data.externalUpdatedAt;
      existing.updatedAt = new Date();
      return existing;
    }

    const now = new Date();
    const event: CalendarEvent = {
      id: this.store.nextId("event"),
      userId,
      type: data.type,
      title: data.title,
      date: data.date,
      startTime: data.startTime,
      notes: data.notes,
      completed: false,
      source: CalendarEventSource.GOOGLE,
      externalId,
      externalUpdatedAt: data.externalUpdatedAt,
      createdAt: now,
      updatedAt: now,
    };
    this.store.calendarEvents.push(event);
    return event;
  }

  async setExternalId(
    id: string,
    externalId: string,
    externalUpdatedAt: Date,
  ): Promise<CalendarEvent> {
    const event = this.store.calendarEvents.find(
      (candidate) => candidate.id === id,
    );

    if (!event) {
      throw new Error(`Calendar event ${id} not found`);
    }

    event.externalId = externalId;
    event.externalUpdatedAt = externalUpdatedAt;
    event.updatedAt = new Date();
    return event;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateCalendarEventData,
  ): Promise<CalendarEvent | null> {
    const event = await this.findByIdForUser(id, userId);

    if (!event) {
      return null;
    }

    if (data.type !== undefined) event.type = data.type;
    if (data.title !== undefined) event.title = data.title;
    if (data.date !== undefined) event.date = data.date;
    if (data.startTime !== undefined) event.startTime = data.startTime;
    if (data.notes !== undefined) event.notes = data.notes;
    if (data.completed !== undefined) event.completed = data.completed;
    event.updatedAt = new Date();
    return event;
  }

  async delete(id: string, userId: string): Promise<void> {
    this.store.calendarEvents = this.store.calendarEvents.filter(
      (event) => !(event.id === id && event.userId === userId),
    );
  }

  async deleteByExternalId(userId: string, externalId: string): Promise<void> {
    this.store.calendarEvents = this.store.calendarEvents.filter(
      (event) =>
        !(event.userId === userId && event.externalId === externalId),
    );
  }

  async deleteBySource(
    userId: string,
    source: CalendarEventSource,
  ): Promise<void> {
    this.store.calendarEvents = this.store.calendarEvents.filter(
      (event) => !(event.userId === userId && event.source === source),
    );
  }
}

export class InMemoryCalendarSyncStateRepository
  implements CalendarSyncStateRepository
{
  private states = new Map<string, CalendarSyncState>();

  async findByUser(userId: string): Promise<CalendarSyncState | null> {
    return this.states.get(userId) ?? null;
  }

  async save(
    userId: string,
    data: SaveCalendarSyncStateData,
  ): Promise<CalendarSyncState> {
    const now = new Date();
    const state: CalendarSyncState = {
      id: `sync-${userId}`,
      userId,
      calendarId: data.calendarId,
      syncToken: data.syncToken,
      lastSyncedAt: data.lastSyncedAt,
      createdAt: now,
      updatedAt: now,
    };
    this.states.set(userId, state);
    return state;
  }

  async deleteByUser(userId: string): Promise<void> {
    this.states.delete(userId);
  }

  async listUserIds(): Promise<string[]> {
    return [...this.states.keys()];
  }
}
