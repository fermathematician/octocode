import type { Request, Response } from "express";
import { env } from "../../../config/env.js";
import { serializeCookie } from "../../../http/cookies.js";
import type { StartGithubLoginService } from "../services/StartGithubLoginService.js";

export const OAUTH_STATE_COOKIE = "octocode_oauth_state";

export class StartGithubLoginController {
  constructor(private readonly service: StartGithubLoginService) {}

  handle = (_request: Request, response: Response): void => {
    try {
      const { state, authorizeUrl } = this.service.execute();

      response.setHeader(
        "Set-Cookie",
        serializeCookie(OAUTH_STATE_COOKIE, state, {
          maxAgeSeconds: 600,
          secure: env.session.secure,
        }),
      );
      response.redirect(authorizeUrl);
    } catch {
      // Browser flow: if OAuth is not configured, return to the login screen
      // with an error flag instead of rendering a raw JSON 503.
      response.redirect(`${env.frontendUrl}/?auth=error`);
    }
  };
}
