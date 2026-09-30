import type { Request, Response } from "express";
import { env } from "../../../config/env.js";
import { clearCookie, parseCookies, serializeCookie } from "../../../http/cookies.js";
import type { HandleGithubCallbackService } from "../services/HandleGithubCallbackService.js";
import { OAUTH_STATE_COOKIE } from "./StartGithubLoginController.js";

export class HandleGithubCallbackController {
  constructor(private readonly service: HandleGithubCallbackService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    const { code, state, error } = request.query;
    const expectedState = parseCookies(request.headers.cookie)[
      OAUTH_STATE_COOKIE
    ];

    if (
      error !== undefined ||
      typeof code !== "string" ||
      typeof state !== "string" ||
      !expectedState ||
      state !== expectedState
    ) {
      response.redirect(`${env.frontendUrl}/?auth=error`);
      return;
    }

    const result = await this.service.execute({
      code,
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    });

    const maxAgeSeconds = Math.max(
      0,
      Math.round((result.expiresAt.getTime() - Date.now()) / 1000),
    );

    response.setHeader("Set-Cookie", [
      serializeCookie(env.session.cookieName, result.sessionToken, {
        maxAgeSeconds,
        secure: env.session.secure,
      }),
      clearCookie(OAUTH_STATE_COOKIE, env.session.secure),
    ]);
    response.redirect(env.frontendUrl);
  };
}
