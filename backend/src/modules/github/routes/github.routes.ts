import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import { parseProjectParams } from "../../projects/validation/project.schema.js";
import { parseStoryParams } from "../../stories/validation/story.schema.js";
import type { GithubWebhookController } from "../controllers/GithubWebhookController.js";
import type { LinkRepositoryController } from "../controllers/LinkRepositoryController.js";
import type { ListProjectBranchesController } from "../controllers/ListProjectBranchesController.js";
import type { ListRepositoriesController } from "../controllers/ListRepositoriesController.js";
import type { RecordLocalBranchesController } from "../controllers/RecordLocalBranchesController.js";
import type { SyncRepositoriesController } from "../controllers/SyncRepositoriesController.js";
import type { SyncStoryCommitsController } from "../controllers/SyncStoryCommitsController.js";
import {
  parseLinkRepositoryBody,
  parseRecordLocalBranchesBody,
} from "../validation/github.schema.js";

export interface GithubControllers {
  listRepositories: ListRepositoriesController;
  listProjectBranches: ListProjectBranchesController;
  recordLocalBranches: RecordLocalBranchesController;
  linkRepository: LinkRepositoryController;
  syncStoryCommits: SyncStoryCommitsController;
  syncRepositories: SyncRepositoriesController;
  webhook: GithubWebhookController;
}

export function createGithubRouter(
  controllers: GithubControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  // Public: authenticated by the GitHub webhook signature, not a session.
  router.post("/webhooks", controllers.webhook.handle);

  router.use(requireAuth);
  router.get("/repositories", controllers.listRepositories.handle);
  router.post(
    "/repositories",
    validate({ body: parseLinkRepositoryBody }),
    controllers.linkRepository.handle,
  );
  router.get(
    "/projects/:projectId/branches",
    validate({ params: parseProjectParams }),
    controllers.listProjectBranches.handle,
  );
  router.post(
    "/branches/local",
    validate({ body: parseRecordLocalBranchesBody }),
    controllers.recordLocalBranches.handle,
  );
  router.post("/sync", controllers.syncRepositories.handle);
  router.post(
    "/stories/:storyId/sync-commits",
    validate({ params: parseStoryParams }),
    controllers.syncStoryCommits.handle,
  );

  return router;
}
