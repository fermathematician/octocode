import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { CreateProjectController } from "../modules/projects/controllers/CreateProjectController.js";
import { GetProjectController } from "../modules/projects/controllers/GetProjectController.js";
import { ListProjectsController } from "../modules/projects/controllers/ListProjectsController.js";
import { createProjectsRouter } from "../modules/projects/routes/projects.routes.js";
import { CreateProjectService } from "../modules/projects/services/CreateProjectService.js";
import { GetProjectService } from "../modules/projects/services/GetProjectService.js";
import { ListProjectsService } from "../modules/projects/services/ListProjectsService.js";
import * as shared from "./shared.js";

const list = new ListProjectsController(
  new ListProjectsService(shared.projectRepository),
);

const get = new GetProjectController(
  new GetProjectService(shared.projectRepository),
);

const create = new CreateProjectController(
  new CreateProjectService(shared.projectRepository),
);

export const projectsRouter = createProjectsRouter(
  { list, get, create },
  requireAuth,
);
