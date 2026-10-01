import { env } from "../config/env.js";
import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { GithubWebhookController } from "../modules/github/controllers/GithubWebhookController.js";
import { LinkRepositoryController } from "../modules/github/controllers/LinkRepositoryController.js";
import { ListProjectBranchesController } from "../modules/github/controllers/ListProjectBranchesController.js";
import { ListRepositoriesController } from "../modules/github/controllers/ListRepositoriesController.js";
import { RecordLocalBranchesController } from "../modules/github/controllers/RecordLocalBranchesController.js";
import { SyncCommitsController } from "../modules/github/controllers/SyncCommitsController.js";
import { SyncStoryCommitsController } from "../modules/github/controllers/SyncStoryCommitsController.js";
import { createGithubRouter } from "../modules/github/routes/github.routes.js";
import { HandleGithubWebhookService } from "../modules/github/services/HandleGithubWebhookService.js";
import { LinkRepositoryService } from "../modules/github/services/LinkRepositoryService.js";
import { ListProjectBranchesService } from "../modules/github/services/ListProjectBranchesService.js";
import { ListRepositoriesService } from "../modules/github/services/ListRepositoriesService.js";
import { RecordLocalBranchesService } from "../modules/github/services/RecordLocalBranchesService.js";
import { SyncCommitsService } from "../modules/github/services/SyncCommitsService.js";
import { SyncStoryCommitsService } from "../modules/github/services/SyncStoryCommitsService.js";
import * as shared from "./shared.js";

const listRepositories = new ListRepositoriesController(
  new ListRepositoriesService(
    shared.oauthAccountRepository,
    shared.tokenCipher,
    shared.githubClient,
  ),
);

const listProjectBranches = new ListProjectBranchesController(
  new ListProjectBranchesService(
    shared.projectRepository,
    shared.githubRepositoryRepository,
    shared.localBranchRepository,
    shared.oauthAccountRepository,
    shared.tokenCipher,
    shared.githubClient,
  ),
);

const recordLocalBranches = new RecordLocalBranchesController(
  new RecordLocalBranchesService(
    shared.githubRepositoryRepository,
    shared.localBranchRepository,
  ),
);

const linkRepository = new LinkRepositoryController(
  new LinkRepositoryService(
    shared.githubRepositoryRepository,
    shared.projectRepository,
  ),
);

const syncStoryCommitsService = new SyncStoryCommitsService(
  shared.storyRepository,
  shared.githubRepositoryRepository,
  shared.commitRepository,
  shared.oauthAccountRepository,
  shared.tokenCipher,
  shared.githubClient,
);

const syncStoryCommits = new SyncStoryCommitsController(
  syncStoryCommitsService,
);

const syncCommitsService = new SyncCommitsService(
  shared.githubRepositoryRepository,
  shared.storyRepository,
  syncStoryCommitsService,
);

const syncCommits = new SyncCommitsController(syncCommitsService);

const webhook = new GithubWebhookController(
  new HandleGithubWebhookService(
    shared.githubRepositoryRepository,
    shared.githubWebhookEventRepository,
    syncCommitsService,
    env.github.webhookSecret,
  ),
);

export const githubRouter = createGithubRouter(
  {
    listRepositories,
    listProjectBranches,
    recordLocalBranches,
    linkRepository,
    syncStoryCommits,
    syncCommits,
    webhook,
  },
  requireAuth,
);

/** Used by the background interval in `server.ts`. */
export const backgroundCommitSync = syncCommitsService;
