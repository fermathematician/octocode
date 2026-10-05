import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TokenCipher } from "../../src/infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../src/infrastructure/github/GithubClient.js";
import type {
  CommitRepository,
  UpsertCommitData,
} from "../../src/modules/github/repositories/CommitRepository.js";
import { SyncStoryCommitsService } from "../../src/modules/github/services/SyncStoryCommitsService.js";
import { AppError } from "../../src/shared/appError.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryOAuthAccountRepository,
  InMemoryStore,
  InMemoryStoryRepository,
} from "../support/fakes.js";

interface Comparison {
  status: string;
  aheadBy: number;
  behindBy: number;
  commits: Array<{
    sha: string;
    message: string;
    authorLogin: string | null;
    authorName: string | null;
    committedAt: Date;
    url: string | null;
  }>;
}

interface Recorded {
  storyId: string;
  branch: string;
  commits: UpsertCommitData[];
}

function commit(sha: string, committedAt = new Date("2026-10-01T00:00:00.000Z")) {
  return {
    sha,
    message: `commit ${sha}`,
    authorLogin: "me",
    authorName: "Me",
    committedAt,
    url: null,
  };
}

function setup(comparison: Comparison | Error) {
  const store = new InMemoryStore();
  const repositories = new InMemoryGithubRepositoryRepository(store);
  const stories = new InMemoryStoryRepository(store);
  const oauthAccounts = new InMemoryOAuthAccountRepository();
  const recorded: Recorded[] = [];

  const commits = {
    replaceForStory: async (
      _repositoryId: string,
      storyId: string,
      branch: string,
      list: UpsertCommitData[],
    ) => {
      recorded.push({ storyId, branch, commits: list });
    },
    countByStory: async () => 0,
  } as unknown as CommitRepository;

  const tokenCipher = {
    decrypt: (value: string) => value.replace("enc:", ""),
  } as unknown as TokenCipher;

  const githubClient = {
    compareBranches: async () => {
      if (comparison instanceof Error) {
        throw comparison;
      }
      return comparison;
    },
    listCommits: async (
      _token: string,
      _owner: string,
      _repo: string,
      branch: string,
    ) => [commit(`${branch}-sha`)],
  } as unknown as GithubClient;

  const service = new SyncStoryCommitsService(
    stories,
    repositories,
    commits,
    oauthAccounts,
    tokenCipher,
    githubClient,
  );

  return { store, repositories, oauthAccounts, recorded, service };
}

async function seed(
  store: InMemoryStore,
  repositories: InMemoryGithubRepositoryRepository,
  oauthAccounts: InMemoryOAuthAccountRepository,
  storyBranch: string,
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

  const story = store.seedStory(project.id, { branch: storyBranch });

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

  return { user, story };
}

describe("SyncStoryCommitsService", () => {
  it("stores only the commits that belong to the story branch", async () => {
    const { store, repositories, oauthAccounts, recorded, service } = setup({
      status: "ahead",
      aheadBy: 1,
      behindBy: 3,
      commits: [commit("feat/wip-sha")],
    });
    const { user, story } = await seed(
      store,
      repositories,
      oauthAccounts,
      "feat/wip",
    );

    const result = await service.execute(user.id, story.id);

    assert.equal(result.commitCount, 1);
    assert.equal(recorded[0]?.branch, "feat/wip");
    assert.deepEqual(
      recorded[0]?.commits.map((entry) => entry.sha),
      ["feat/wip-sha"],
    );
  });

  it("uses all commits when the story branch is the default branch", async () => {
    const { store, repositories, oauthAccounts, recorded, service } = setup({
      status: "identical",
      aheadBy: 0,
      behindBy: 0,
      commits: [],
    });
    const { user, story } = await seed(
      store,
      repositories,
      oauthAccounts,
      "main",
    );

    await service.execute(user.id, story.id);

    assert.equal(recorded[0]?.branch, "main");
    assert.deepEqual(
      recorded[0]?.commits.map((entry) => entry.sha),
      ["main-sha"],
    );
  });

  it("stores nothing when the branch does not exist on GitHub", async () => {
    const { store, repositories, oauthAccounts, recorded, service } = setup(
      new AppError("not found", 404),
    );
    const { user, story } = await seed(
      store,
      repositories,
      oauthAccounts,
      "feat/missing",
    );

    const result = await service.execute(user.id, story.id);

    assert.equal(result.commitCount, 0);
    assert.deepEqual(recorded[0]?.commits, []);
  });

  it("rejects a project without a linked repository", async () => {
    const { store, service } = setup({
      status: "ahead",
      aheadBy: 0,
      behindBy: 0,
      commits: [],
    });
    const user = store.seedUser();
    const project = store.seedProject(user.id);
    const story = store.seedStory(project.id);

    await assert.rejects(
      () => service.execute(user.id, story.id),
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 400,
    );
  });
});
