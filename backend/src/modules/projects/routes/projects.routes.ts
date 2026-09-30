import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import type { CreateProjectController } from "../controllers/CreateProjectController.js";
import type { GetProjectController } from "../controllers/GetProjectController.js";
import type { ListProjectsController } from "../controllers/ListProjectsController.js";
import {
  parseCreateProjectBody,
  parseProjectParams,
} from "../validation/project.schema.js";

export interface ProjectControllers {
  list: ListProjectsController;
  get: GetProjectController;
  create: CreateProjectController;
}

export function createProjectsRouter(
  controllers: ProjectControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.use(requireAuth);
  router.get("/", controllers.list.handle);
  router.post(
    "/",
    validate({ body: parseCreateProjectBody }),
    controllers.create.handle,
  );
  router.get(
    "/:projectId",
    validate({ params: parseProjectParams }),
    controllers.get.handle,
  );

  return router;
}
