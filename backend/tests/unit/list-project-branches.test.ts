import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TokenCipher } from "../../src/infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../src/infrastructure/github/GithubClient.js";
import { ListProjectBranchesService } from "../../src/modules/github/services/ListProjectBranchesService.js";
import { AppError } from "../../src/shared/appError.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryLocalBranchRepository,
  InMemoryOAuthAccountRepository,
  InMemoryProjectRepository,
  InMemoryStore,
} from "../support/fakes.js";

function setup() {
  const store = new InMemoryStore();
  const projects = new InMemoryProjectRepository(store);
  const githubRepositories = new InMemoryGithubRepositoryRepository(store);
  const localBranches = new InMemoryLocalBranchRepository(store);
  const oauthAccounts = new InMemoryOAuthAccountRepository();
  const tokenCipher = {
    decrypt: (value: string) => value.replace("enc:", ""),
  } as unknown as TokenCipher;
  const githubClient = {
    listBranches: async () => [{ name: "main" }, { name: "feat/x" }],
  } as unknown as GithubClient;

  const service = new ListProjectBranchesService(
    projects,
    githubRepositories,
    localBranches,
    oauthAccounts,
    tokenCipher,
    githubClient,
  );

  return { store, githubRepositories, localBranches, oauthAccounts, service };
}

async function linkAccount(
  oauthAccounts: InMemoryOAuthAccountRepository,
  userId: string,
): Promise<void> {
  await oauthAccounts.save({
    userId,
    provider: "GITHUB",
    providerAccountId: "1",
    accessToken: "enc:token",
    refreshToken: null,
    tokenType: null,
    scope: "",
    expiresAt: null,
  });
}

function isAppError(statusCode: number) {
  return (error: unknown): boolean =>
    error instanceof AppError && error.statusCode === statusCode;
}

describe("ListProjectBranchesService", () => {
  it("returns branch names for a linked project", async () => {
    const { store, githubRepositories, oauthAccounts, service } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);

    await githubRepositories.save({
      projectId: project.id,
      userId: user.id,
      repoId: "1",
      owner: "owner",
      name: "repo",
      defaultBranch: "main",
      isPrivate: false,
      installationId: null,
    });
    await linkAccount(oauthAccounts, user.id);

    const branches = await service.execute(user.id, project.id);
    assert.deepEqual(branches, [
      { name: "main", source: "github" },
      { name: "feat/x", source: "github" },
    ]);
  });

  it("appends local branches that are not on GitHub", async () => {
    const { store, githubRepositories, localBranches, oauthAccounts, service } =
      setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);

    await githubRepositories.save({
      projectId: project.id,
      userId: user.id,
      repoId: "1",
      owner: "owner",
      name: "repo",
      defaultBranch: "main",
      isPrivate: false,
      installationId: null,
    });
    await linkAccount(oauthAccounts, user.id);
    await localBranches.replaceAll(project.id, ["wip/local-only", "main"]);

    const branches = await service.execute(user.id, project.id);

    assert.deepEqual(branches, [
      { name: "main", source: "github" },
      { name: "feat/x", source: "github" },
      { name: "wip/local-only", source: "local" },
    ]);
  });

  it("rejects a project with no linked repository", async () => {
    const { store, oauthAccounts, service } = setup();
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    await linkAccount(oauthAccounts, user.id);

    await assert.rejects(
      () => service.execute(user.id, project.id),
      isAppError(400),
    );
  });

  it("rejects an unknown project", async () => {
    const { store, service } = setup();
    const user = store.seedUser();

    await assert.rejects(
      () => service.execute(user.id, "missing"),
      isAppError(404),
    );
  });
});
