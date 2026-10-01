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

interface RecordedBranch {
  branch: string;
  commits: UpsertCommitData[];
}

function setup(
  comparison: { status: string; aheadBy: number; behindBy: number } | Error,
) {
  const store = new InMemoryStore();
  const repositories = new InMemoryGithubRepositoryRepository(store);
  const stories = new InMemoryStoryRepository(store);
  const oauthAccounts = new InMemoryOAuthAccountRepository();
  const recorded: RecordedBranch[] = [];

  const commits = {
    upsertMany: async (
      _repositoryId: string,
      _storyId: string,
      list: UpsertCommitData[],
    ) => {
      recorded.push({ branch: list[0]?.branch ?? "(none)", commits: list });
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
    ) => [
      {
        sha: `${branch}-sha`,
        message: `commit on ${branch}`,
        authorLogin: "me",
        authorName: "Me",
        committedAt: new Date("2026-10-01T00:00:00.000Z"),
        url: null,
      },
    ],
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

describe("SyncStoryCommitsService branch resolution", () => {
  it("uses the default branch when the story branch is fully merged", async () => {
    const { store, repositories, oauthAccounts, recorded, service } = setup({
      status: "ahead",
      aheadBy: 10,
      behindBy: 0,
    });
    const { user, story } = await seed(
      store,
      repositories,
      oauthAccounts,
      "feat/merged",
    );

    const result = await service.execute(user.id, story.id);

    assert.equal(recorded[0]?.branch, "main");
    assert.equal(recorded[0]?.commits[0]?.sha, "main-sha");
    assert.equal(result.commitCount, 1);
  });

  it("keeps the story branch when it has unmerged commits", async () => {
    const { store, repositories, oauthAccounts, recorded, service } = setup({
      status: "diverged",
      aheadBy: 4,
      behindBy: 2,
    });
    const { user, story } = await seed(
      store,
      repositories,
      oauthAccounts,
      "feat/wip",
    );

    await service.execute(user.id, story.id);

    assert.equal(recorded[0]?.branch, "feat/wip");
    assert.equal(recorded[0]?.commits[0]?.sha, "feat/wip-sha");
  });

  it("falls back to the default branch when the story branch was never pushed", async () => {
    const { store, repositories, oauthAccounts, recorded, service } = setup(
      new AppError("not found", 404),
    );
    const { user, story } = await seed(
      store,
      repositories,
      oauthAccounts,
      "feat/missing",
    );

    await service.execute(user.id, story.id);

    assert.equal(recorded[0]?.branch, "main");
    assert.equal(recorded[0]?.commits[0]?.sha, "main-sha");
  });

  it("uses the story branch directly when it is the default branch", async () => {
    const { store, repositories, oauthAccounts, recorded, service } = setup({
      status: "identical",
      aheadBy: 0,
      behindBy: 0,
    });
    const { user, story } = await seed(
      store,
      repositories,
      oauthAccounts,
      "main",
    );

    await service.execute(user.id, story.id);

    assert.equal(recorded[0]?.branch, "main");
  });
});
