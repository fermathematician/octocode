import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  StoryPriority,
  StoryStatus,
} from "../../src/generated/prisma/client.js";
import { GetCurrentUserService } from "../../src/modules/auth/services/GetCurrentUserService.js";
import { CreateSprintService } from "../../src/modules/sprints/services/CreateSprintService.js";
import { CreateStoryService } from "../../src/modules/stories/services/CreateStoryService.js";
import { MoveStoryToSprintService } from "../../src/modules/stories/services/MoveStoryToSprintService.js";
import { UpdateStoryStatusService } from "../../src/modules/stories/services/UpdateStoryStatusService.js";
import { AppError } from "../../src/shared/appError.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryProjectRepository,
  InMemorySprintRepository,
  InMemoryStore,
  InMemoryStoryRepository,
  InMemoryUserRepository,
} from "../support/fakes.js";

function setup() {
  const store = new InMemoryStore();

  return {
    store,
    projects: new InMemoryProjectRepository(store),
    sprints: new InMemorySprintRepository(store),
    stories: new InMemoryStoryRepository(store),
    users: new InMemoryUserRepository(store),
    githubRepositories: new InMemoryGithubRepositoryRepository(store),
  };
}

function isAppError(statusCode: number) {
  return (error: unknown): boolean =>
    error instanceof AppError && error.statusCode === statusCode;
}

describe("CreateStoryService", () => {
  it("assigns the latest sprint and generates a branch", async () => {
    const { store, projects, sprints, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    store.seedSprint(project.id, { startDate: new Date("2030-01-01") });
    const latest = store.seedSprint(project.id, {
      startDate: new Date("2030-02-01"),
    });

    const service = new CreateStoryService(stories, sprints, projects);
    const story = await service.execute(user.id, {
      projectId: project.id,
      title: "Add login",
      storyPoints: 5,
      priority: StoryPriority.HIGH,
    });

    assert.equal(story.sprintId, latest.id);
    assert.equal(story.branch, "feat/add-login");
    assert.equal(story.status, StoryStatus.BACKLOG.toLowerCase());
    assert.equal(story.priority, "high");
  });

  it("deduplicates generated branches", async () => {
    const { store, projects, sprints, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    store.seedStory(project.id, { branch: "feat/add-login" });

    const service = new CreateStoryService(stories, sprints, projects);
    const story = await service.execute(user.id, {
      projectId: project.id,
      title: "Add login",
      storyPoints: 3,
      priority: StoryPriority.LOW,
    });

    assert.equal(story.branch, "feat/add-login-2");
  });

  it("honors an explicit branch", async () => {
    const { store, projects, sprints, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);

    const service = new CreateStoryService(stories, sprints, projects);
    const story = await service.execute(user.id, {
      projectId: project.id,
      title: "Add login",
      storyPoints: 3,
      priority: StoryPriority.LOW,
      branch: "feat/custom",
    });

    assert.equal(story.branch, "feat/custom");
  });

  it("rejects an unknown project", async () => {
    const { store, projects, sprints, stories } = setup();
    const user = store.seedUser();
    const service = new CreateStoryService(stories, sprints, projects);

    await assert.rejects(
      () =>
        service.execute(user.id, {
          projectId: "missing",
          title: "X",
          storyPoints: 1,
          priority: StoryPriority.LOW,
        }),
      isAppError(404),
    );
  });
});

describe("MoveStoryToSprintService", () => {
  it("moves a story into a sprint of the same project", async () => {
    const { store, sprints, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const sprint = store.seedSprint(project.id);
    const story = store.seedStory(project.id);

    const service = new MoveStoryToSprintService(stories, sprints);
    const moved = await service.execute(user.id, story.id, sprint.id);

    assert.equal(moved.sprintId, sprint.id);
  });

  it("clears the sprint when sprintId is null", async () => {
    const { store, sprints, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const sprint = store.seedSprint(project.id);
    const story = store.seedStory(project.id, { sprintId: sprint.id });

    const service = new MoveStoryToSprintService(stories, sprints);
    const moved = await service.execute(user.id, story.id, null);

    assert.equal(moved.sprintId, null);
  });

  it("rejects a sprint from another project", async () => {
    const { store, sprints, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const otherProject = store.seedProject(user.id);
    const otherSprint = store.seedSprint(otherProject.id);
    const story = store.seedStory(project.id);

    const service = new MoveStoryToSprintService(stories, sprints);

    await assert.rejects(
      () => service.execute(user.id, story.id, otherSprint.id),
      isAppError(400),
    );
  });

  it("rejects an unknown story", async () => {
    const { store, sprints, stories } = setup();
    const user = store.seedUser();
    const service = new MoveStoryToSprintService(stories, sprints);

    await assert.rejects(
      () => service.execute(user.id, "missing", null),
      isAppError(404),
    );
  });
});

describe("UpdateStoryStatusService", () => {
  it("sets completedAt when moving to refactor", async () => {
    const { store, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const story = store.seedStory(project.id);

    const service = new UpdateStoryStatusService(stories);
    const updated = await service.execute(
      user.id,
      story.id,
      StoryStatus.REFACTOR,
    );

    assert.equal(updated.status, "refactor");
    assert.ok(updated.completedAt);
  });

  it("clears completedAt when leaving refactor", async () => {
    const { store, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const story = store.seedStory(project.id, {
      status: StoryStatus.REFACTOR,
      completedAt: new Date(),
    });

    const service = new UpdateStoryStatusService(stories);
    const updated = await service.execute(user.id, story.id, StoryStatus.CODE);

    assert.equal(updated.status, "code");
    assert.equal(updated.completedAt, null);
  });

  it("rejects a story the actor does not own", async () => {
    const { store, stories } = setup();
    const owner = store.seedUser();
    const stranger = store.seedUser();
    const project = store.seedProject(owner.id);
    const story = store.seedStory(project.id);

    const service = new UpdateStoryStatusService(stories);

    await assert.rejects(
      () => service.execute(stranger.id, story.id, StoryStatus.CODE),
      isAppError(404),
    );
  });
});

describe("CreateSprintService", () => {
  it("computes a 7-day window", async () => {
    const { store, projects, sprints } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);

    const service = new CreateSprintService(sprints, projects);
    const sprint = await service.execute(user.id, {
      projectId: project.id,
      name: "Sprint 1",
      startDate: "2030-02-01",
    });

    assert.equal(sprint.startDate, "2030-02-01");
    assert.equal(sprint.endDate, "2030-02-07");
  });

  it("rejects an unknown project", async () => {
    const { store, projects, sprints } = setup();
    const user = store.seedUser();
    const service = new CreateSprintService(sprints, projects);

    await assert.rejects(
      () =>
        service.execute(user.id, {
          projectId: "missing",
          name: "Sprint 1",
          startDate: "2030-02-01",
        }),
      isAppError(404),
    );
  });
});

describe("GetCurrentUserService", () => {
  it("returns the user", async () => {
    const { store, users } = setup();
    const user = store.seedUser({ login: "gabriel" });

    const service = new GetCurrentUserService(users);
    const dto = await service.execute(user.id);

    assert.equal(dto.login, "gabriel");
  });

  it("rejects an unknown user", async () => {
    const { users } = setup();
    const service = new GetCurrentUserService(users);

    await assert.rejects(() => service.execute("missing"), isAppError(404));
  });
});
