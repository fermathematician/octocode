import { Router, type RequestHandler } from "express";
import type { GetDebugOverviewController } from "../controllers/GetDebugOverviewController.js";

export interface DebugControllers {
  overview: GetDebugOverviewController;
}

export function createDebugRouter(
  controllers: DebugControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.use(requireAuth);
  router.get("/overview", controllers.overview.handle);

  return router;
}
