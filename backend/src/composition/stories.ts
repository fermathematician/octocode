import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { AssignStoryBranchController } from "../modules/stories/controllers/AssignStoryBranchController.js";
import { CreateStoryController } from "../modules/stories/controllers/CreateStoryController.js";
import { ListStoriesController } from "../modules/stories/controllers/ListStoriesController.js";
import { UpdateStoryStatusController } from "../modules/stories/controllers/UpdateStoryStatusController.js";
import { createStoriesRouter } from "../modules/stories/routes/stories.routes.js";
import { AssignStoryBranchService } from "../modules/stories/services/AssignStoryBranchService.js";
import { CreateStoryService } from "../modules/stories/services/CreateStoryService.js";
import { ListStoriesService } from "../modules/stories/services/ListStoriesService.js";
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

const updateStatus = new UpdateStoryStatusController(
  new UpdateStoryStatusService(shared.storyRepository),
);

const assignBranch = new AssignStoryBranchController(
  new AssignStoryBranchService(shared.storyRepository),
);

export const storiesRouter = createStoriesRouter(
  { list, create, updateStatus, assignBranch },
  requireAuth,
);
