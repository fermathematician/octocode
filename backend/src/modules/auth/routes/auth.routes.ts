import { Router, type RequestHandler } from "express";
import { validate } from "../../../http/middleware/validate.js";
import type { CreateDevSessionController } from "../controllers/CreateDevSessionController.js";
import type { GetCurrentUserController } from "../controllers/GetCurrentUserController.js";
import type { HandleGithubCallbackController } from "../controllers/HandleGithubCallbackController.js";
import type { LogoutAllController } from "../controllers/LogoutAllController.js";
import type { LogoutController } from "../controllers/LogoutController.js";
import type { StartGithubLoginController } from "../controllers/StartGithubLoginController.js";
import { parseDevTokenBody } from "../validation/dev-token.schema.js";

export interface AuthControllers {
  startLogin: StartGithubLoginController;
  callback: HandleGithubCallbackController;
  currentUser: GetCurrentUserController;
  logout: LogoutController;
  logoutAll: LogoutAllController;
  devToken: CreateDevSessionController;
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
  router.post(
    "/dev-token",
    validate({ body: parseDevTokenBody }),
    controllers.devToken.handle,
  );

  return router;
}
