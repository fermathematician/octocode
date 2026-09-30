import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { CreateSprintController } from "../modules/sprints/controllers/CreateSprintController.js";
import { ListSprintsController } from "../modules/sprints/controllers/ListSprintsController.js";
import { createSprintsRouter } from "../modules/sprints/routes/sprints.routes.js";
import { CreateSprintService } from "../modules/sprints/services/CreateSprintService.js";
import { ListSprintsService } from "../modules/sprints/services/ListSprintsService.js";
import * as shared from "./shared.js";

const list = new ListSprintsController(
  new ListSprintsService(shared.sprintRepository),
);

const create = new CreateSprintController(
  new CreateSprintService(shared.sprintRepository, shared.projectRepository),
);

export const sprintsRouter = createSprintsRouter({ list, create }, requireAuth);
