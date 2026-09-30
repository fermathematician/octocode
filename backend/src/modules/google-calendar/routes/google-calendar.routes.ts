import { Router, type RequestHandler } from "express";
import type { DisconnectGoogleController } from "../controllers/DisconnectGoogleController.js";
import type { GetCalendarSyncStatusController } from "../controllers/GetCalendarSyncStatusController.js";
import type { HandleGoogleCallbackController } from "../controllers/HandleGoogleCallbackController.js";
import type { StartGoogleLinkController } from "../controllers/StartGoogleLinkController.js";
import type { SyncCalendarController } from "../controllers/SyncCalendarController.js";

export interface GoogleCalendarControllers {
  startLink: StartGoogleLinkController;
  callback: HandleGoogleCallbackController;
  status: GetCalendarSyncStatusController;
  disconnect: DisconnectGoogleController;
  sync: SyncCalendarController;
}

export function createGoogleCalendarRouter(
  controllers: GoogleCalendarControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.use(requireAuth);
  router.get("/google", controllers.startLink.handle);
  router.get("/google/callback", controllers.callback.handle);
  router.get("/google/status", controllers.status.handle);
  router.delete("/google", controllers.disconnect.handle);
  router.post("/google/sync", controllers.sync.handle);

  return router;
}
