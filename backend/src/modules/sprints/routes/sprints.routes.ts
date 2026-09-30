import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import type { CreateSprintController } from "../controllers/CreateSprintController.js";
import type { ListSprintsController } from "../controllers/ListSprintsController.js";
import {
  parseCreateSprintBody,
  parseListSprintsQuery,
} from "../validation/sprint.schema.js";

export interface SprintControllers {
  list: ListSprintsController;
  create: CreateSprintController;
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

  return router;
}
