import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import { parseProjectParams } from "../../projects/validation/project.schema.js";
import { parseStoryParams } from "../../stories/validation/story.schema.js";
import type { GithubWebhookController } from "../controllers/GithubWebhookController.js";
import type { LinkRepositoryController } from "../controllers/LinkRepositoryController.js";
import type { ListProjectBranchesController } from "../controllers/ListProjectBranchesController.js";
import type { ListRepositoriesController } from "../controllers/ListRepositoriesController.js";
import type { SyncCommitsController } from "../controllers/SyncCommitsController.js";
import type { SyncStoryCommitsController } from "../controllers/SyncStoryCommitsController.js";
import { parseLinkRepositoryBody } from "../validation/github.schema.js";

export interface GithubControllers {
  listRepositories: ListRepositoriesController;
  listProjectBranches: ListProjectBranchesController;
  linkRepository: LinkRepositoryController;
  syncStoryCommits: SyncStoryCommitsController;
  syncCommits: SyncCommitsController;
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
  router.post("/sync", controllers.syncCommits.handle);
  router.post(
    "/stories/:storyId/sync-commits",
    validate({ params: parseStoryParams }),
    controllers.syncStoryCommits.handle,
  );

  return router;
}
