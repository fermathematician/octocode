import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TokenCipher } from "../../src/infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../src/infrastructure/github/GithubClient.js";
import { GetDebugOverviewService } from "../../src/modules/debug/services/GetDebugOverviewService.js";
import { AppError } from "../../src/shared/appError.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryOAuthAccountRepository,
  InMemoryProjectRepository,
  InMemoryStore,
} from "../support/fakes.js";

function setup(
  commits: Array<{ sha: string; message: string; committedAt: Date }> = [],
) {
  const store = new InMemoryStore();
  const projects = new InMemoryProjectRepository(store);
  const oauthAccounts = new InMemoryOAuthAccountRepository();
  const githubRepositories = new InMemoryGithubRepositoryRepository(store);

  const tokenCipher = {
    decrypt: (value: string) => value.replace("enc:", ""),
  } as unknown as TokenCipher;

  const githubClient = {
    listBranches: async () => [{ name: "main" }, { name: "feat/x" }],
    listCommits: async () =>
      commits.map((commit) => ({
        ...commit,
        authorLogin: "me",
        authorName: "Me",
        url: null,
      })),
  } as unknown as GithubClient;

  const service = new GetDebugOverviewService(
    projects,
    oauthAccounts,
    tokenCipher,
    githubClient,
  );

  return { store, oauthAccounts, githubRepositories, service };
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

describe("GetDebugOverviewService", () => {
  it("reports branches and recent commits for a linked repo", async () => {
    const { store, oauthAccounts, githubRepositories, service } = setup([
      {
        sha: "abc1234",
        message: "hello",
        committedAt: new Date("2026-10-01T10:00:00.000Z"),
      },
    ]);
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

    const result = await service.execute(user.id);

    assert.equal(result.repositories.length, 1);
    assert.equal(result.repositories[0]?.branchCount, 2);
    assert.deepEqual(result.repositories[0]?.branches, ["main", "feat/x"]);
    assert.equal(result.repositories[0]?.commits.length, 1);
    assert.equal(result.repositories[0]?.commits[0]?.message, "hello");
    assert.equal(result.repositories[0]?.commits[0]?.author, "me");
  });

  it("flags a project that has no linked repository", async () => {
    const { store, oauthAccounts, service } = setup();
    const user = store.seedUser();
    store.seedProject(user.id);
    await linkAccount(oauthAccounts, user.id);

    const result = await service.execute(user.id);

    assert.equal(result.repositories[0]?.repository, null);
    assert.match(result.repositories[0]?.branchError ?? "", /no linked/i);
  });

  it("rejects when no GitHub account is connected", async () => {
    const { store, service } = setup();
    const user = store.seedUser();

    await assert.rejects(
      () => service.execute(user.id),
      (error: unknown): boolean =>
        error instanceof AppError && error.statusCode === 400,
    );
  });
});
