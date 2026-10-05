import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TokenCipher } from "../../src/infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../src/infrastructure/github/GithubClient.js";
import type {
  CommitRepository,
  UpsertCommitData,
} from "../../src/modules/github/repositories/CommitRepository.js";
import { SyncBranchStoriesService } from "../../src/modules/github/services/SyncBranchStoriesService.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryOAuthAccountRepository,
  InMemorySprintRepository,
  InMemoryStore,
  InMemoryStoryRepository,
} from "../support/fakes.js";

interface RecordedCommits {
  storyId: string;
  commits: UpsertCommitData[];
}

function setup(branches: string[], commitDates: Record<string, Date>) {
  const store = new InMemoryStore();
  const repositories = new InMemoryGithubRepositoryRepository(store);
  const stories = new InMemoryStoryRepository(store);
  const sprints = new InMemorySprintRepository(store);
  const oauthAccounts = new InMemoryOAuthAccountRepository();
  const recorded: RecordedCommits[] = [];

  const commits = {
    upsertMany: async (
      _repositoryId: string,
      storyId: string,
      list: UpsertCommitData[],
    ) => {
      recorded.push({ storyId, commits: list });
    },
    countByStory: async () => 0,
  } as unknown as CommitRepository;

  const tokenCipher = {
    decrypt: (value: string) => value.replace("enc:", ""),
  } as unknown as TokenCipher;

  const githubClient = {
    listBranches: async () => branches.map((name) => ({ name })),
    listCommits: async (
      _token: string,
      _owner: string,
      _repo: string,
      branch: string,
    ) => [
      {
        sha: `${branch}-sha`,
        message: `work on ${branch}`,
        authorLogin: "me",
        authorName: "Me",
        committedAt:
          commitDates[branch] ?? new Date("2030-01-01T00:00:00.000Z"),
        url: null,
      },
    ],
  } as unknown as GithubClient;

  const service = new SyncBranchStoriesService(
    repositories,
    stories,
    sprints,
    commits,
    oauthAccounts,
    tokenCipher,
    githubClient,
  );

  return { store, repositories, sprints, stories, oauthAccounts, recorded, service };
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

describe("SyncBranchStoriesService", () => {
  it("creates a card for a branch with activity during the sprint", async () => {
    const { store, repositories, sprints, oauthAccounts, recorded, service } =
      setup(["main", "feat/new"], {
        "feat/new": new Date("2030-03-02T00:00:00.000Z"),
      });
    const { user, sprint } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      new Date("2030-03-01T00:00:00.000Z"),
    );

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 1);
    const story = store.stories[0];
    assert.equal(story?.branch, "feat/new");
    assert.equal(story?.title, "New");
    assert.equal(story?.status, "CODE");
    assert.equal(story?.storyPoints, 1);
    assert.equal(story?.priority, "MEDIUM");
    assert.equal(story?.imported, true);
    assert.equal(story?.sprintId, sprint?.id);
    assert.equal(recorded.length, 1);
    assert.equal(recorded[0]?.commits[0]?.branch, "feat/new");
  });

  it("skips the default branch and branches older than the sprint", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["main", "feat/old"],
      { "feat/old": new Date("2030-01-01T00:00:00.000Z") },
    );
    const { user } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      new Date("2030-03-01T00:00:00.000Z"),
    );

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 0);
    assert.equal(store.stories.length, 0);
  });

  it("skips branches that already have a story", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["feat/existing"],
      { "feat/existing": new Date("2030-03-10T00:00:00.000Z") },
    );
    const { user, project } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      new Date("2030-03-01T00:00:00.000Z"),
    );
    store.seedStory(project.id, { branch: "feat/existing" });

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 0);
    assert.equal(store.stories.length, 1);
  });

  it("does nothing when the user has no sprint", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["feat/new"],
      { "feat/new": new Date("2030-03-10T00:00:00.000Z") },
    );
    const { user } = await seed(store, repositories, sprints, oauthAccounts, null);

    const result = await service.executeForUser(user.id);

    assert.equal(result.created, 0);
    assert.equal(store.stories.length, 0);
  });

  it("is idempotent on a repeated sync", async () => {
    const { store, repositories, sprints, oauthAccounts, service } = setup(
      ["feat/new"],
      { "feat/new": new Date("2030-03-10T00:00:00.000Z") },
    );
    const { user } = await seed(
      store,
      repositories,
      sprints,
      oauthAccounts,
      new Date("2030-03-01T00:00:00.000Z"),
    );

    const first = await service.executeForUser(user.id);
    const second = await service.executeForUser(user.id);

    assert.equal(first.created, 1);
    assert.equal(second.created, 0);
    assert.equal(store.stories.length, 1);
  });
});
