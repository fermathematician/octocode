import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import type { SessionProvider } from "../../infrastructure/auth/SessionProvider.js";
import { AppError } from "../../shared/appError.js";
import { parseCookies } from "../cookies.js";

export function createEnsureAuthenticated(
  sessions: SessionProvider,
): RequestHandler {
  return async (request, _response, next) => {
    try {
      const token = parseCookies(request.headers.cookie)[env.session.cookieName];

      if (token) {
        const session = await sessions.findValid(token);

        if (session) {
          request.auth = { userId: session.userId };
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requireAuth: RequestHandler = (request, _response, next) => {
  if (!request.auth) {
    next(new AppError("Authentication required", 401));
    return;
  }

  next();
};
