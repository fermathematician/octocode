import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { LinkRepositoryController } from "../modules/github/controllers/LinkRepositoryController.js";
import { ListProjectBranchesController } from "../modules/github/controllers/ListProjectBranchesController.js";
import { ListRepositoriesController } from "../modules/github/controllers/ListRepositoriesController.js";
import { SyncStoryCommitsController } from "../modules/github/controllers/SyncStoryCommitsController.js";
import { createGithubRouter } from "../modules/github/routes/github.routes.js";
import { LinkRepositoryService } from "../modules/github/services/LinkRepositoryService.js";
import { ListProjectBranchesService } from "../modules/github/services/ListProjectBranchesService.js";
import { ListRepositoriesService } from "../modules/github/services/ListRepositoriesService.js";
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
    shared.oauthAccountRepository,
    shared.tokenCipher,
    shared.githubClient,
  ),
);

const linkRepository = new LinkRepositoryController(
  new LinkRepositoryService(
    shared.githubRepositoryRepository,
    shared.projectRepository,
  ),
);

const syncStoryCommits = new SyncStoryCommitsController(
  new SyncStoryCommitsService(
    shared.storyRepository,
    shared.githubRepositoryRepository,
    shared.commitRepository,
    shared.oauthAccountRepository,
    shared.tokenCipher,
    shared.githubClient,
  ),
);

export const githubRouter = createGithubRouter(
  { listRepositories, listProjectBranches, linkRepository, syncStoryCommits },
  requireAuth,
);
