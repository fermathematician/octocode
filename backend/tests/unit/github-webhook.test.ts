import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import type { GithubWebhookEventRepository } from "../../src/modules/github/repositories/GithubWebhookEventRepository.js";
import type { SyncRepositoriesService } from "../../src/modules/github/services/SyncRepositoriesService.js";
import { HandleGithubWebhookService } from "../../src/modules/github/services/HandleGithubWebhookService.js";
import { AppError } from "../../src/shared/appError.js";
import {
  InMemoryGithubRepositoryRepository,
  InMemoryStore,
} from "../support/fakes.js";

const SECRET = "test-secret";

function sign(body: string, secret = SECRET): string {
  return `sha256=${createHmac("sha256", secret)
    .update(Buffer.from(body))
    .digest("hex")}`;
}

function setup(secret = SECRET) {
  const store = new InMemoryStore();
  const repositories = new InMemoryGithubRepositoryRepository(store);
  const deliveries = new Set<string>();
  const synced: string[] = [];

  const webhookEvents = {
    record: async (deliveryId: string) => {
      if (deliveries.has(deliveryId)) {
        return false;
      }
      deliveries.add(deliveryId);
      return true;
    },
  } as unknown as GithubWebhookEventRepository;

  const syncRepositories = {
    executeForRepository: async (repository: { id: string }) => {
      synced.push(repository.id);
      return { branchesCreated: 0, stories: 0, commits: 0 };
    },
  } as unknown as SyncRepositoriesService;

  const service = new HandleGithubWebhookService(
    repositories,
    webhookEvents,
    syncRepositories,
    secret,
  );

  return { store, repositories, service, synced };
}

async function linkRepo(
  store: InMemoryStore,
  repositories: InMemoryGithubRepositoryRepository,
  owner: string,
  name: string,
): Promise<string> {
  const user = store.seedUser();
  const project = store.seedProject(user.id);

  const repository = await repositories.save({
    projectId: project.id,
    userId: user.id,
    repoId: "1",
    owner,
    name,
    defaultBranch: "main",
    isPrivate: false,
    installationId: null,
  });

  return repository.id;
}

function isAppError(error: unknown, statusCode: number): boolean {
  return error instanceof AppError && error.statusCode === statusCode;
}

describe("HandleGithubWebhookService", () => {
  it("syncs the matching repository on a valid push event", async () => {
    const { store, repositories, service, synced } = setup();
    const repositoryId = await linkRepo(store, repositories, "owner", "repo");
    const body = JSON.stringify({ repository: { full_name: "owner/repo" } });

    await service.execute({
      event: "push",
      deliveryId: "delivery-1",
      signature: sign(body),
      rawBody: Buffer.from(body),
      payload: JSON.parse(body),
    });

    assert.deepEqual(synced, [repositoryId]);
  });

  it("rejects an invalid signature", async () => {
    const { service } = setup();
    const body = JSON.stringify({ repository: { full_name: "owner/repo" } });
    const signature = sign(body, "wrong-secret");

    await assert.rejects(
      () =>
        service.execute({
          event: "push",
          deliveryId: "delivery-2",
          signature,
          rawBody: Buffer.from(body),
          payload: JSON.parse(body),
        }),
      (error: unknown) => isAppError(error, 401),
    );
  });

  it("ignores a duplicate delivery", async () => {
    const { store, repositories, service, synced } = setup();
    await linkRepo(store, repositories, "owner", "repo");
    const body = JSON.stringify({ repository: { full_name: "owner/repo" } });
    const input = {
      event: "push",
      deliveryId: "delivery-3",
      signature: sign(body),
      rawBody: Buffer.from(body),
      payload: JSON.parse(body),
    };

    await service.execute(input);
    await service.execute(input);

    assert.equal(synced.length, 1);
  });

  it("ignores non-push events", async () => {
    const { store, repositories, service, synced } = setup();
    await linkRepo(store, repositories, "owner", "repo");
    const body = JSON.stringify({ repository: { full_name: "owner/repo" } });

    await service.execute({
      event: "issues",
      deliveryId: "delivery-4",
      signature: sign(body),
      rawBody: Buffer.from(body),
      payload: JSON.parse(body),
    });

    assert.deepEqual(synced, []);
  });

  it("returns 503 when webhooks are not configured", async () => {
    const { service } = setup("");
    const body = JSON.stringify({ repository: { full_name: "owner/repo" } });

    await assert.rejects(
      () =>
        service.execute({
          event: "push",
          deliveryId: "delivery-5",
          signature: sign(body),
          rawBody: Buffer.from(body),
          payload: JSON.parse(body),
        }),
      (error: unknown) => isAppError(error, 503),
    );
  });
});
