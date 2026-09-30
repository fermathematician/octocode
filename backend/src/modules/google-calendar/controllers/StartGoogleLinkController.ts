import type { Request, Response } from "express";
import { env } from "../../../config/env.js";
import { serializeCookie } from "../../../http/cookies.js";
import type { StartGoogleLinkService } from "../services/StartGoogleLinkService.js";

export const GOOGLE_STATE_COOKIE = "octocode_google_state";

export class StartGoogleLinkController {
  constructor(private readonly service: StartGoogleLinkService) {}

  handle = (_request: Request, response: Response): void => {
    try {
      const { state, authorizeUrl } = this.service.execute();

      response.setHeader(
        "Set-Cookie",
        serializeCookie(GOOGLE_STATE_COOKIE, state, {
          maxAgeSeconds: 600,
          secure: env.session.secure,
        }),
      );
      response.redirect(authorizeUrl);
    } catch {
      // Browser flow: return to the app instead of rendering a JSON error.
      response.redirect(`${env.frontendUrl}?google=error`);
    }
  };
}
