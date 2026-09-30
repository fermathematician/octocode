import type { Request, Response } from "express";
import { env } from "../../../config/env.js";
import { serializeCookie } from "../../../http/cookies.js";
import { AppError } from "../../../shared/appError.js";
import type { GithubSignInService } from "../services/GithubSignInService.js";
import type { DevTokenInput } from "../validation/dev-token.schema.js";

/**
 * Dev-only: sign in with a GitHub personal access token instead of the OAuth
 * flow. Disabled unless ALLOW_DEV_TOKEN_LOGIN=true. Never enable in production.
 */
export class CreateDevSessionController {
  constructor(private readonly signIn: GithubSignInService) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    if (!env.allowDevTokenLogin) {
      throw new AppError("Dev token login is disabled.", 404);
    }

    const { token } = request.validated?.body as DevTokenInput;

    const result = await this.signIn.execute({
      accessToken: token,
      scope: "personal-access-token",
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    });

    const maxAgeSeconds = Math.max(
      0,
      Math.round((result.expiresAt.getTime() - Date.now()) / 1000),
    );

    response.setHeader(
      "Set-Cookie",
      serializeCookie(env.session.cookieName, result.sessionToken, {
        maxAgeSeconds,
        secure: env.session.secure,
      }),
    );
    response.status(200).json(result.user);
  };
}
