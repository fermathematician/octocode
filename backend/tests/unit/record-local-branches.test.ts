import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RecordLocalBranchesService } from "../../src/modules/github/services/RecordLocalBranchesService.js";
import { AppError } from "../../src/shared/appError.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryLocalBranchRepository,
  InMemoryStore,
} from "../support/fakes.js";

function setup() {
  const store = new InMemoryStore();
  const githubRepositories = new InMemoryGithubRepositoryRepository(store);
  const localBranches = new InMemoryLocalBranchRepository(store);
  const service = new RecordLocalBranchesService(
    githubRepositories,
    localBranches,
  );

  return { store, githubRepositories, localBranches, service };
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

function isAppError(statusCode: number) {
  return (error: unknown): boolean =>
    error instanceof AppError && error.statusCode === statusCode;
}

describe("RecordLocalBranchesService", () => {
  it("records the reported branches for the linked project", async () => {
    const { store, githubRepositories, localBranches, service } = setup();
    const { userId, projectId } = await linkRepo(store, githubRepositories);

    const result = await service.execute(userId, {
      owner: "owner",
      name: "repo",
      names: ["feat/a", "feat/b"],
    });

    assert.deepEqual(result, { projectId, recorded: 2 });
    const stored = await localBranches.listByProject(projectId);
    assert.deepEqual(
      stored.map((branch) => branch.name).sort(),
      ["feat/a", "feat/b"],
    );
  });

  it("replaces the previous set so deleted branches disappear", async () => {
    const { store, githubRepositories, localBranches, service } = setup();
    const { userId, projectId } = await linkRepo(store, githubRepositories);

    await service.execute(userId, {
      owner: "owner",
      name: "repo",
      names: ["feat/a", "feat/b"],
    });
    await service.execute(userId, {
      owner: "owner",
      name: "repo",
      names: ["feat/b", "feat/c"],
    });

    const stored = await localBranches.listByProject(projectId);
    assert.deepEqual(
      stored.map((branch) => branch.name).sort(),
      ["feat/b", "feat/c"],
    );
  });

  it("de-duplicates repeated names", async () => {
    const { store, githubRepositories, service } = setup();
    const { userId } = await linkRepo(store, githubRepositories);

    const result = await service.execute(userId, {
      owner: "owner",
      name: "repo",
      names: ["feat/a", "feat/a"],
    });

    assert.equal(result.recorded, 1);
  });

  it("rejects a repository that is not linked", async () => {
    const { store, service } = setup();
    const user = store.seedUser();

    await assert.rejects(
      () =>
        service.execute(user.id, {
          owner: "owner",
          name: "repo",
          names: ["feat/a"],
        }),
      isAppError(404),
    );
  });

  it("does not let another user's link match", async () => {
    const { store, service } = setup();
    await linkRepo(store, new InMemoryGithubRepositoryRepository(store));
    const other = store.seedUser();

    await assert.rejects(
      () =>
        service.execute(other.id, {
          owner: "owner",
          name: "repo",
          names: ["feat/a"],
        }),
      isAppError(404),
    );
  });
});
