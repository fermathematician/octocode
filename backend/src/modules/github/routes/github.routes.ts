import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import { parseStoryParams } from "../../stories/validation/story.schema.js";
import type { LinkRepositoryController } from "../controllers/LinkRepositoryController.js";
import type { ListRepositoriesController } from "../controllers/ListRepositoriesController.js";
import type { SyncStoryCommitsController } from "../controllers/SyncStoryCommitsController.js";
import { parseLinkRepositoryBody } from "../validation/github.schema.js";

export interface GithubControllers {
  listRepositories: ListRepositoriesController;
  linkRepository: LinkRepositoryController;
  syncStoryCommits: SyncStoryCommitsController;
}

export function createGithubRouter(
  controllers: GithubControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.use(requireAuth);
  router.get("/repositories", controllers.listRepositories.handle);
  router.post(
    "/repositories",
    validate({ body: parseLinkRepositoryBody }),
    controllers.linkRepository.handle,
  );
  router.post(
    "/stories/:storyId/sync-commits",
    validate({ params: parseStoryParams }),
    controllers.syncStoryCommits.handle,
  );

  return router;
}
