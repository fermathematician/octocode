import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import type { AssignStoryBranchController } from "../controllers/AssignStoryBranchController.js";
import type { CreateStoryController } from "../controllers/CreateStoryController.js";
import type { ListStoriesController } from "../controllers/ListStoriesController.js";
import type { UpdateStoryStatusController } from "../controllers/UpdateStoryStatusController.js";
import {
  parseAssignBranchBody,
  parseCreateStoryBody,
  parseListStoriesQuery,
  parseStoryParams,
  parseUpdateStatusBody,
} from "../validation/story.schema.js";

export interface StoryControllers {
  list: ListStoriesController;
  create: CreateStoryController;
  updateStatus: UpdateStoryStatusController;
  assignBranch: AssignStoryBranchController;
}

export function createStoriesRouter(
  controllers: StoryControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.use(requireAuth);
  router.get(
    "/",
    validate({ query: parseListStoriesQuery }),
    controllers.list.handle,
  );
  router.post(
    "/",
    validate({ body: parseCreateStoryBody }),
    controllers.create.handle,
  );
  router.patch(
    "/:storyId/status",
    validate({
      params: parseStoryParams,
      body: parseUpdateStatusBody,
    }),
    controllers.updateStatus.handle,
  );
  router.patch(
    "/:storyId/branch",
    validate({
      params: parseStoryParams,
      body: parseAssignBranchBody,
    }),
    controllers.assignBranch.handle,
  );

  return router;
}
