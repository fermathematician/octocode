import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import type { AssignStoryBranchController } from "../controllers/AssignStoryBranchController.js";
import type { CreateStoryController } from "../controllers/CreateStoryController.js";
import type { ListStoriesController } from "../controllers/ListStoriesController.js";
import type { MoveStoryToSprintController } from "../controllers/MoveStoryToSprintController.js";
import type { UpdateStoryController } from "../controllers/UpdateStoryController.js";
import type { UpdateStoryStatusController } from "../controllers/UpdateStoryStatusController.js";
import {
  parseAssignBranchBody,
  parseCreateStoryBody,
  parseListStoriesQuery,
  parseMoveStorySprintBody,
  parseStoryParams,
  parseUpdateStatusBody,
  parseUpdateStoryBody,
} from "../validation/story.schema.js";

export interface StoryControllers {
  list: ListStoriesController;
  create: CreateStoryController;
  update: UpdateStoryController;
  updateStatus: UpdateStoryStatusController;
  assignBranch: AssignStoryBranchController;
  moveToSprint: MoveStoryToSprintController;
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
  router.patch(
    "/:storyId/sprint",
    validate({
      params: parseStoryParams,
      body: parseMoveStorySprintBody,
    }),
    controllers.moveToSprint.handle,
  );
  router.patch(
    "/:storyId",
    validate({
      params: parseStoryParams,
      body: parseUpdateStoryBody,
    }),
    controllers.update.handle,
  );

  return router;
}
