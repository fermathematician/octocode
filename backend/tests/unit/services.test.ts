import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  StoryPriority,
  StoryStatus,
} from "../../src/generated/prisma/client.js";
import { GetCurrentUserService } from "../../src/modules/auth/services/GetCurrentUserService.js";
import { UpdateCalendarEventService } from "../../src/modules/calendar/services/UpdateCalendarEventService.js";
import { DeleteProjectService } from "../../src/modules/projects/services/DeleteProjectService.js";
import { CreateSprintService } from "../../src/modules/sprints/services/CreateSprintService.js";
import { CreateStoryService } from "../../src/modules/stories/services/CreateStoryService.js";
import { DeleteStoryService } from "../../src/modules/stories/services/DeleteStoryService.js";
import { MoveStoryToSprintService } from "../../src/modules/stories/services/MoveStoryToSprintService.js";
import { UpdateStoryStatusService } from "../../src/modules/stories/services/UpdateStoryStatusService.js";
import { AppError } from "../../src/shared/appError.js";
import {
  InMemoryCalendarEventRepository,
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
    calendarEvents: new InMemoryCalendarEventRepository(store),
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
    store.seedSprint(user.id, { startDate: new Date("2030-01-01") });
    const latest = store.seedSprint(user.id, {
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
  it("moves a story into a sprint", async () => {
    const { store, sprints, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const sprint = store.seedSprint(user.id);
    const story = store.seedStory(project.id);

    const service = new MoveStoryToSprintService(stories, sprints);
    const moved = await service.execute(user.id, story.id, sprint.id);

    assert.equal(moved.sprintId, sprint.id);
  });

  it("clears the sprint when sprintId is null", async () => {
    const { store, sprints, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const sprint = store.seedSprint(user.id);
    const story = store.seedStory(project.id, { sprintId: sprint.id });

    const service = new MoveStoryToSprintService(stories, sprints);
    const moved = await service.execute(user.id, story.id, null);

    assert.equal(moved.sprintId, null);
  });

  it("rejects a sprint owned by another user", async () => {
    const { store, sprints, stories } = setup();
    const user = store.seedUser();
    const stranger = store.seedUser();
    const project = store.seedProject(user.id);
    const strangerSprint = store.seedSprint(stranger.id);
    const story = store.seedStory(project.id);

    const service = new MoveStoryToSprintService(stories, sprints);

    await assert.rejects(
      () => service.execute(user.id, story.id, strangerSprint.id),
      isAppError(404),
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

describe("DeleteStoryService", () => {
  it("deletes a story the actor owns", async () => {
    const { store, stories } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const story = store.seedStory(project.id);

    const service = new DeleteStoryService(stories);
    await service.execute(user.id, story.id);

    assert.equal(store.stories.find((item) => item.id === story.id), undefined);
  });

  it("rejects an unknown story", async () => {
    const { store, stories } = setup();
    const user = store.seedUser();
    const service = new DeleteStoryService(stories);

    await assert.rejects(
      () => service.execute(user.id, "missing"),
      isAppError(404),
    );
  });

  it("rejects a story the actor does not own", async () => {
    const { store, stories } = setup();
    const owner = store.seedUser();
    const stranger = store.seedUser();
    const project = store.seedProject(owner.id);
    const story = store.seedStory(project.id);

    const service = new DeleteStoryService(stories);

    await assert.rejects(
      () => service.execute(stranger.id, story.id),
      isAppError(404),
    );
    assert.ok(store.stories.find((item) => item.id === story.id));
  });
});

describe("DeleteProjectService", () => {
  it("deletes a project the actor owns", async () => {
    const { store, projects } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);

    const service = new DeleteProjectService(projects);
    await service.execute(user.id, project.id);

    assert.equal(
      store.projects.find((item) => item.id === project.id),
      undefined,
    );
  });

  it("rejects an unknown project", async () => {
    const { store, projects } = setup();
    const user = store.seedUser();
    const service = new DeleteProjectService(projects);

    await assert.rejects(
      () => service.execute(user.id, "missing"),
      isAppError(404),
    );
  });

  it("rejects a project the actor does not own", async () => {
    const { store, projects } = setup();
    const owner = store.seedUser();
    const stranger = store.seedUser();
    const project = store.seedProject(owner.id);

    const service = new DeleteProjectService(projects);

    await assert.rejects(
      () => service.execute(stranger.id, project.id),
      isAppError(404),
    );
    assert.ok(store.projects.find((item) => item.id === project.id));
  });
});

describe("CreateSprintService", () => {
  it("creates a sprint with the given date range", async () => {
    const { store, sprints } = setup();
    const user = store.seedUser();

    const service = new CreateSprintService(sprints);
    const sprint = await service.execute(user.id, {
      name: "Sprint 1",
      startDate: "2030-02-01",
      endDate: "2030-02-14",
    });

    assert.equal(sprint.startDate, "2030-02-01");
    assert.equal(sprint.endDate, "2030-02-14");
    assert.equal(sprint.name, "Sprint 1");
  });

  it("rejects an end date before the start date", async () => {
    const { store, sprints } = setup();
    const user = store.seedUser();
    const service = new CreateSprintService(sprints);

    await assert.rejects(
      () =>
        service.execute(user.id, {
          name: "Sprint 1",
          startDate: "2030-02-10",
          endDate: "2030-02-01",
        }),
      isAppError(400),
    );
  });
});

describe("UpdateCalendarEventService", () => {
  it("marks a task completed", async () => {
    const { store, calendarEvents } = setup();
    const user = store.seedUser();
    const event = store.seedCalendarEvent(user.id, { completed: false });

    const service = new UpdateCalendarEventService(calendarEvents);
    const updated = await service.execute(user.id, event.id, {
      completed: true,
    });

    assert.equal(updated.completed, true);
  });

  it("rejects an event the actor does not own", async () => {
    const { store, calendarEvents } = setup();
    const owner = store.seedUser();
    const stranger = store.seedUser();
    const event = store.seedCalendarEvent(owner.id);

    const service = new UpdateCalendarEventService(calendarEvents);

    await assert.rejects(
      () => service.execute(stranger.id, event.id, { completed: true }),
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
