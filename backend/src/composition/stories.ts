import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { AssignStoryBranchController } from "../modules/stories/controllers/AssignStoryBranchController.js";
import { CreateStoryController } from "../modules/stories/controllers/CreateStoryController.js";
import { DeleteStoryController } from "../modules/stories/controllers/DeleteStoryController.js";
import { ListStoriesController } from "../modules/stories/controllers/ListStoriesController.js";
import { MoveStoryToSprintController } from "../modules/stories/controllers/MoveStoryToSprintController.js";
import { UpdateStoryController } from "../modules/stories/controllers/UpdateStoryController.js";
import { UpdateStoryStatusController } from "../modules/stories/controllers/UpdateStoryStatusController.js";
import { createStoriesRouter } from "../modules/stories/routes/stories.routes.js";
import { AssignStoryBranchService } from "../modules/stories/services/AssignStoryBranchService.js";
import { CreateStoryService } from "../modules/stories/services/CreateStoryService.js";
import { DeleteStoryService } from "../modules/stories/services/DeleteStoryService.js";
import { ListStoriesService } from "../modules/stories/services/ListStoriesService.js";
import { MoveStoryToSprintService } from "../modules/stories/services/MoveStoryToSprintService.js";
import { UpdateStoryService } from "../modules/stories/services/UpdateStoryService.js";
import { UpdateStoryStatusService } from "../modules/stories/services/UpdateStoryStatusService.js";
import * as shared from "./shared.js";

const list = new ListStoriesController(
  new ListStoriesService(shared.storyRepository),
);

const create = new CreateStoryController(
  new CreateStoryService(
    shared.storyRepository,
    shared.sprintRepository,
    shared.projectRepository,
  ),
);

const update = new UpdateStoryController(
  new UpdateStoryService(shared.storyRepository),
);

const updateStatus = new UpdateStoryStatusController(
  new UpdateStoryStatusService(shared.storyRepository),
);

const assignBranch = new AssignStoryBranchController(
  new AssignStoryBranchService(shared.storyRepository),
);

const moveToSprint = new MoveStoryToSprintController(
  new MoveStoryToSprintService(
    shared.storyRepository,
    shared.sprintRepository,
  ),
);

const remove = new DeleteStoryController(
  new DeleteStoryService(shared.storyRepository),
);

export const storiesRouter = createStoriesRouter(
  { list, create, update, updateStatus, assignBranch, moveToSprint, remove },
  requireAuth,
);
