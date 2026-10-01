import { requireAuth } from "../http/middleware/ensureAuthenticated.js";
import { GetDebugOverviewController } from "../modules/debug/controllers/GetDebugOverviewController.js";
import { createDebugRouter } from "../modules/debug/routes/debug.routes.js";
import { GetDebugOverviewService } from "../modules/debug/services/GetDebugOverviewService.js";
import * as shared from "./shared.js";

const overview = new GetDebugOverviewController(
  new GetDebugOverviewService(
    shared.projectRepository,
    shared.oauthAccountRepository,
    shared.tokenCipher,
    shared.githubClient,
  ),
);

export const debugRouter = createDebugRouter({ overview }, requireAuth);
