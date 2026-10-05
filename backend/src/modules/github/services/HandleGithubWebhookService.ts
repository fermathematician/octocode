import { verifyGithubWebhookSignature } from "../../../infrastructure/github/GithubWebhookVerifier.js";
import { AppError } from "../../../shared/appError.js";
import type { GithubRepositoryRepository } from "../repositories/GithubRepositoryRepository.js";
import type { GithubWebhookEventRepository } from "../repositories/GithubWebhookEventRepository.js";
import type { SyncRepositoriesService } from "./SyncRepositoriesService.js";

export interface HandleGithubWebhookInput {
  event: string | undefined;
  deliveryId: string | undefined;
  signature: string | undefined;
  rawBody: Buffer | undefined;
  payload: unknown;
}

export class HandleGithubWebhookService {
  constructor(
    private readonly repositories: GithubRepositoryRepository,
    private readonly webhookEvents: GithubWebhookEventRepository,
    private readonly syncRepositories: SyncRepositoriesService,
    private readonly secret: string,
  ) {}

  async execute(input: HandleGithubWebhookInput): Promise<void> {
    if (!this.secret) {
      throw new AppError("GitHub webhooks are not configured.", 503);
    }

    if (!input.deliveryId) {
      throw new AppError("Missing X-GitHub-Delivery header.", 400);
    }

    if (
      !input.rawBody ||
      !verifyGithubWebhookSignature(
        this.secret,
        input.rawBody,
        input.signature,
      )
    ) {
      throw new AppError("Invalid webhook signature.", 401);
    }

    const isNew = await this.webhookEvents.record(
      input.deliveryId,
      input.event ?? "unknown",
    );

    if (!isNew) {
      return;
    }

    if (input.event !== "push") {
      return;
    }

    const fullName = extractRepositoryFullName(input.payload);

    if (!fullName) {
      return;
    }

    const [owner, name] = fullName.split("/");

    if (!owner || !name) {
      return;
    }

    const repositories = await this.repositories.findAllByOwnerAndName(
      owner,
      name,
    );

    for (const repository of repositories) {
      await this.syncRepositories.executeForRepository(repository);
    }
  }
}

function extractRepositoryFullName(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("repository" in payload)) {
    return null;
  }

  const repository = (payload as { repository?: unknown }).repository;

  if (
    !repository ||
    typeof repository !== "object" ||
    !("full_name" in repository)
  ) {
    return null;
  }

  const fullName = (repository as { full_name?: unknown }).full_name;

  return typeof fullName === "string" ? fullName : null;
}
