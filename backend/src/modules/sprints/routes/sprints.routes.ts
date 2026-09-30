import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import type { CreateSprintController } from "../controllers/CreateSprintController.js";
import type { DeleteSprintController } from "../controllers/DeleteSprintController.js";
import type { ListSprintsController } from "../controllers/ListSprintsController.js";
import type { UpdateSprintController } from "../controllers/UpdateSprintController.js";
import {
  parseCreateSprintBody,
  parseListSprintsQuery,
  parseSprintParams,
  parseUpdateSprintBody,
} from "../validation/sprint.schema.js";

export interface SprintControllers {
  list: ListSprintsController;
  create: CreateSprintController;
  update: UpdateSprintController;
  remove: DeleteSprintController;
}

export function createSprintsRouter(
  controllers: SprintControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.use(requireAuth);
  router.get(
    "/",
    validate({ query: parseListSprintsQuery }),
    controllers.list.handle,
  );
  router.post(
    "/",
    validate({ body: parseCreateSprintBody }),
    controllers.create.handle,
  );
  router.patch(
    "/:sprintId",
    validate({
      params: parseSprintParams,
      body: parseUpdateSprintBody,
    }),
    controllers.update.handle,
  );
  router.delete(
    "/:sprintId",
    validate({ params: parseSprintParams }),
    controllers.remove.handle,
  );

  return router;
}
