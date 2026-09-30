import type { Request, Response } from "express";
import { env } from "../../../config/env.js";
import { clearCookie, parseCookies } from "../../../http/cookies.js";
import type { LogoutService } from "../services/LogoutService.js";

export class LogoutController {
  constructor(private readonly service: LogoutService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    const token = parseCookies(request.headers.cookie)[env.session.cookieName];
    await this.service.execute(token);

    response.setHeader(
      "Set-Cookie",
      clearCookie(env.session.cookieName, env.session.secure),
    );
    response.status(204).end();
  };
}
