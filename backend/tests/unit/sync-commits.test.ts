import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SyncStoryCommitsService } from "../../src/modules/github/services/SyncStoryCommitsService.js";
import { SyncCommitsService } from "../../src/modules/github/services/SyncCommitsService.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryStore,
  InMemoryStoryRepository,
} from "../support/fakes.js";

function setup() {
  const store = new InMemoryStore();
  const repositories = new InMemoryGithubRepositoryRepository(store);
  const stories = new InMemoryStoryRepository(store);
  const synced: string[] = [];
  const failing = new Set<string>();

  const syncStoryCommits = {
    execute: async (_ownerId: string, storyId: string) => {
      if (failing.has(storyId)) {
        throw new Error("boom");
      }
      synced.push(storyId);
      return { commitCount: 1 };
    },
  } as unknown as SyncStoryCommitsService;

  const service = new SyncCommitsService(
    repositories,
    stories,
    syncStoryCommits,
  );

  return { store, repositories, service, synced, failing };
}

async function linkRepo(
  store: InMemoryStore,
  repositories: InMemoryGithubRepositoryRepository,
): Promise<{ userId: string; projectId: string }> {
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

  return { userId: user.id, projectId: project.id };
}

describe("SyncCommitsService", () => {
  it("syncs every story of the user's repositories", async () => {
    const { store, repositories, service, synced } = setup();
    const { userId, projectId } = await linkRepo(store, repositories);
    store.seedStory(projectId);
    store.seedStory(projectId);

    const result = await service.executeForUser(userId);

    assert.equal(result.stories, 2);
    assert.equal(result.commits, 2);
    assert.equal(synced.length, 2);
  });

  it("continues when one story fails", async () => {
    const { store, repositories, service, synced, failing } = setup();
    const { userId, projectId } = await linkRepo(store, repositories);
    const first = store.seedStory(projectId);
    const second = store.seedStory(projectId);
    failing.add(first.id);

    const result = await service.executeForUser(userId);

    assert.equal(result.stories, 1);
    assert.deepEqual(synced, [second.id]);
  });

  it("does nothing when the user has no linked repositories", async () => {
    const { store, service } = setup();
    const user = store.seedUser();

    const result = await service.executeForUser(user.id);

    assert.deepEqual(result, { stories: 0, commits: 0 });
  });
});
