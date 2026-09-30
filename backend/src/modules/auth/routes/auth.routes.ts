import { Router, type RequestHandler } from "express";
import type { GetCurrentUserController } from "../controllers/GetCurrentUserController.js";
import type { HandleGithubCallbackController } from "../controllers/HandleGithubCallbackController.js";
import type { LogoutAllController } from "../controllers/LogoutAllController.js";
import type { LogoutController } from "../controllers/LogoutController.js";
import type { StartGithubLoginController } from "../controllers/StartGithubLoginController.js";

export interface AuthControllers {
  startLogin: StartGithubLoginController;
  callback: HandleGithubCallbackController;
  currentUser: GetCurrentUserController;
  logout: LogoutController;
  logoutAll: LogoutAllController;
}

export function createAuthRouter(
  controllers: AuthControllers,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get("/github", controllers.startLogin.handle);
  router.get("/github/callback", controllers.callback.handle);
  router.get("/me", requireAuth, controllers.currentUser.handle);
  router.post("/logout", controllers.logout.handle);
  router.post("/logout-all", requireAuth, controllers.logoutAll.handle);

  return router;
}
