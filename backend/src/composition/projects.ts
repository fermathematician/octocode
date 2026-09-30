import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { CreateProjectController } from "../modules/projects/controllers/CreateProjectController.js";
import { DeleteProjectController } from "../modules/projects/controllers/DeleteProjectController.js";
import { GetProjectController } from "../modules/projects/controllers/GetProjectController.js";
import { ListProjectsController } from "../modules/projects/controllers/ListProjectsController.js";
import { UpdateProjectController } from "../modules/projects/controllers/UpdateProjectController.js";
import { createProjectsRouter } from "../modules/projects/routes/projects.routes.js";
import { CreateProjectService } from "../modules/projects/services/CreateProjectService.js";
import { DeleteProjectService } from "../modules/projects/services/DeleteProjectService.js";
import { GetProjectService } from "../modules/projects/services/GetProjectService.js";
import { ListProjectsService } from "../modules/projects/services/ListProjectsService.js";
import { UpdateProjectService } from "../modules/projects/services/UpdateProjectService.js";
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

const update = new UpdateProjectController(
  new UpdateProjectService(shared.projectRepository),
);

const remove = new DeleteProjectController(
  new DeleteProjectService(shared.projectRepository),
);

export const projectsRouter = createProjectsRouter(
  { list, get, create, update, remove },
  requireAuth,
);
