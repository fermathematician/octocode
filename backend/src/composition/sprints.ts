import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { CreateSprintController } from "../modules/sprints/controllers/CreateSprintController.js";
import { DeleteSprintController } from "../modules/sprints/controllers/DeleteSprintController.js";
import { ListSprintsController } from "../modules/sprints/controllers/ListSprintsController.js";
import { UpdateSprintController } from "../modules/sprints/controllers/UpdateSprintController.js";
import { createSprintsRouter } from "../modules/sprints/routes/sprints.routes.js";
import { CreateSprintService } from "../modules/sprints/services/CreateSprintService.js";
import { DeleteSprintService } from "../modules/sprints/services/DeleteSprintService.js";
import { ListSprintsService } from "../modules/sprints/services/ListSprintsService.js";
import { UpdateSprintService } from "../modules/sprints/services/UpdateSprintService.js";
import * as shared from "./shared.js";

const list = new ListSprintsController(
  new ListSprintsService(shared.sprintRepository),
);

const create = new CreateSprintController(
  new CreateSprintService(shared.sprintRepository, shared.projectRepository),
);

const update = new UpdateSprintController(
  new UpdateSprintService(shared.sprintRepository),
);

const remove = new DeleteSprintController(
  new DeleteSprintService(shared.sprintRepository),
);

export const sprintsRouter = createSprintsRouter(
  { list, create, update, remove },
  requireAuth,
);
