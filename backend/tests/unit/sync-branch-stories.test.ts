import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TokenCipher } from "../../src/infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../src/infrastructure/github/GithubClient.js";
import { SyncBranchStoriesService } from "../../src/modules/github/services/SyncBranchStoriesService.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryOAuthAccountRepository,
  InMemorySprintRepository,
  InMemoryStore,
  InMemoryStoryRepository,
} from "../support/fakes.js";

function setup(branches: string[], commitsFor: (branch: string) => Date | null) {
  const store = new InMemoryStore();
  const repositories = new InMemoryGithubRepositoryRepository(store);
  const stories = new InMemoryStoryRepository(store);
  const sprints = new InMemorySprintRepository(store);
  const oauthAccounts = new InMemoryOAuthAccountRepository();

  const tokenCipher = {
    decrypt: (value: string) => value.replace("enc:", ""),
  } as unknown as TokenCipher;

  const githubClient = {
    listBranches: async () => branches.map((name) => ({ name })),
    compareBranches: async (
      _token: string,
      _owner: string,
      _repo: string,
      _base: string,
      head: string,
    ) => {
      const committedAt = commitsFor(head);

      return {
        status: "ahead",
        aheadBy: committedAt ? 1 : 0,
        behindBy: 0,
        commits: committedAt
          ? [
              {
                sha: `${head}-sha`,
                message: `work on ${head}`,
                authorLogin: "me",
                authorName: "Me",
                committedAt,
                url: null,
              },
            ]
          : [],
      };
    },
  } as unknown as GithubClient;

  const service = new SyncBranchStoriesService(
    repositories,
    stories,
    sprints,
    oauthAccounts,
    tokenCipher,
    githubClient,
  );

  return { store, repositories, sprints, stories, oauthAccounts, service };
}

async function seed(
  store: InMemoryStore,
  repositories: InMemoryGithubRepositoryRepository,
  sprints: InMemorySprintRepository,
  oauthAccounts: InMemoryOAuthAccountRepository,
  sprintStart: Date | null,
) {
  const user = store.seedUser();
  const project = store.seedProject(user.id);

  await repositories.save({
    projectId: project.id,
    userId: user.id,
    repoId: "1",
    owner: "owner",
    name: "repo",
    defaultBranch: "main",
    isPrivate: false,
    installationId: null,
  });

  await oauthAccounts.save({
    userId: user.id,
    provider: "GITHUB",
    providerAccountId: "1",
    accessToken: "enc:token",
    refreshToken: null,
    tokenType: null,
    scope: "",
    expiresAt: null,
  });

  const sprint = sprintStart
    ? store.seedSprint(user.id, { startDate: sprintStart })
    : null;

  return { user, project, sprint };
}

const SPRINT_START = new Date("2030-03-01T00:00:00.000Z");
const RECENT = new Date("2030-03-02T00:00:00.000Z");
const OLD = new Date("2030-01-01T00:00:00.000Z");

describe("SyncBranchStoriesService", () => {
  it("creates a backlog card for a branch with activity during the sprint", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["main", "feat/new"],
      (branch) => (branch === "feat/new" ? RECENT : null),
    );
    const { user, sprint } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      SPRINT_START,
    );

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 1);
    const story = store.stories[0];
    assert.equal(story?.branch, "feat/new");
    assert.equal(story?.title, "New");
    assert.equal(story?.status, "BACKLOG");
    assert.equal(story?.storyPoints, 1);
    assert.equal(story?.priority, "MEDIUM");
    assert.equal(story?.imported, true);
    assert.equal(story?.sprintId, sprint?.id);
  });

  it("skips branches whose own commits are older than the sprint", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["main", "feat/old"],
      (branch) => (branch === "feat/old" ? OLD : null),
    );
    const { user } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      SPRINT_START,
    );

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 0);
    assert.equal(store.stories.length, 0);
  });

  it("skips a branch with no commits of its own", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["feat/inherited"],
      () => null,
    );
    const { user } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      SPRINT_START,
    );

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 0);
    assert.equal(store.stories.length, 0);
  });

  it("skips branches that already have a story", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["feat/new"],
      () => RECENT,
    );
    const { user, project } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      SPRINT_START,
    );
    store.seedStory(project.id, { branch: "feat/new" });

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 0);
    assert.equal(store.stories.length, 1);
  });

  it("does nothing when the user has no sprint", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["feat/new"],
      () => RECENT,
    );
    const { user } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      null,
    );

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 0);
    assert.equal(store.stories.length, 0);
  });

  it("is idempotent on a repeated sync", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["feat/new", "feat/old", "feat/inherited"],
      () => RECENT,
    );
    const { user } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      SPRINT_START,
    );

    const first = await service.executeForUser(user.id);
    const second = await service.executeForUser(user.id);

    assert.equal(first.created, 3);
    assert.equal(second.created, 0);
    assert.equal(store.stories.length, 3);
  });
});
