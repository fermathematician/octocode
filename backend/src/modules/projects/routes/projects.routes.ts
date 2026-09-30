import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import type { CreateProjectController } from "../controllers/CreateProjectController.js";
import type { DeleteProjectController } from "../controllers/DeleteProjectController.js";
import type { GetProjectController } from "../controllers/GetProjectController.js";
import type { ListProjectsController } from "../controllers/ListProjectsController.js";
import type { UpdateProjectController } from "../controllers/UpdateProjectController.js";
import {
  parseCreateProjectBody,
  parseListProjectsQuery,
  parseProjectParams,
  parseUpdateProjectBody,
} from "../validation/project.schema.js";

export interface ProjectControllers {
  list: ListProjectsController;
  get: GetProjectController;
  create: CreateProjectController;
  update: UpdateProjectController;
  remove: DeleteProjectController;
}

export function createProjectsRouter(
  controllers: ProjectControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.use(requireAuth);
  router.get(
    "/",
    validate({ query: parseListProjectsQuery }),
    controllers.list.handle,
  );
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
  router.patch(
    "/:projectId",
    validate({
      params: parseProjectParams,
      body: parseUpdateProjectBody,
    }),
    controllers.update.handle,
  );
  router.delete(
    "/:projectId",
    validate({ params: parseProjectParams }),
    controllers.remove.handle,
  );

  return router;
}
