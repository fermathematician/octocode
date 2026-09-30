import type { Request, Response } from "express";
import { env } from "../../../config/env.js";
import { clearCookie, parseCookies } from "../../../http/cookies.js";
import { AppError } from "../../../shared/appError.js";
import type { HandleGoogleCallbackService } from "../services/HandleGoogleCallbackService.js";
import { GOOGLE_STATE_COOKIE } from "./StartGoogleLinkController.js";

export class HandleGoogleCallbackController {
  constructor(private readonly service: HandleGoogleCallbackService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) {
      throw new AppError("Authentication required", 401);
    }

    const { code, state, error } = request.query;
    const expectedState = parseCookies(request.headers.cookie)[
      GOOGLE_STATE_COOKIE
    ];

    if (
      error !== undefined ||
      typeof code !== "string" ||
      typeof state !== "string" ||
      !expectedState ||
      state !== expectedState
    ) {
      response.redirect(`${env.frontendUrl}?google=error`);
      return;
    }

    await this.service.execute({ userId: request.auth.userId, code });

    response.setHeader(
      "Set-Cookie",
      clearCookie(GOOGLE_STATE_COOKIE, env.session.secure),
    );
    response.redirect(`${env.frontendUrl}?google=connected`);
  };
}
