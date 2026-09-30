import {
  createEnsureAuthenticated,
  requireAuth,
} from "../http/middleware/ensureAuthenticated.js";
import { GetCurrentUserController } from "../modules/auth/controllers/GetCurrentUserController.js";
import { HandleGithubCallbackController } from "../modules/auth/controllers/HandleGithubCallbackController.js";
import { LogoutAllController } from "../modules/auth/controllers/LogoutAllController.js";
import { LogoutController } from "../modules/auth/controllers/LogoutController.js";
import { StartGithubLoginController } from "../modules/auth/controllers/StartGithubLoginController.js";
import { createAuthRouter } from "../modules/auth/routes/auth.routes.js";
import { GetCurrentUserService } from "../modules/auth/services/GetCurrentUserService.js";
import { HandleGithubCallbackService } from "../modules/auth/services/HandleGithubCallbackService.js";
import { LogoutAllService } from "../modules/auth/services/LogoutAllService.js";
import { LogoutService } from "../modules/auth/services/LogoutService.js";
import { StartGithubLoginService } from "../modules/auth/services/StartGithubLoginService.js";
import * as shared from "./shared.js";

const startLogin = new StartGithubLoginController(
  new StartGithubLoginService(shared.githubClient),
);

const callback = new HandleGithubCallbackController(
  new HandleGithubCallbackService(
    shared.githubClient,
    shared.tokenCipher,
    shared.userRepository,
    shared.oauthAccountRepository,
    shared.sessionProvider,
  ),
);

const currentUser = new GetCurrentUserController(
  new GetCurrentUserService(shared.userRepository),
);

const logout = new LogoutController(
  new LogoutService(shared.sessionProvider),
);

const logoutAll = new LogoutAllController(
  new LogoutAllService(shared.sessionProvider),
);

export const ensureAuthenticated = createEnsureAuthenticated(
  shared.sessionProvider,
);

export const authRouter = createAuthRouter(
  { startLogin, callback, currentUser, logout, logoutAll },
  requireAuth,
);
