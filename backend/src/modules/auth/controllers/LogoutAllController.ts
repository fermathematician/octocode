import type { Request, Response } from "express";
import { env } from "../../../config/env.js";
import { clearCookie } from "../../../http/cookies.js";
import { AppError } from "../../../shared/appError.js";
import type { LogoutAllService } from "../services/LogoutAllService.js";

export class LogoutAllController {
  constructor(private readonly service: LogoutAllService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    await this.service.execute(request.auth.userId);

    response.setHeader(
      "Set-Cookie",
      clearCookie(env.session.cookieName, env.session.secure),
    );
    response.status(204).end();
  };
}
