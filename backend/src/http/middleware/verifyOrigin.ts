import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/// CSRF hardening: reject state-changing requests whose browser Origin is not the
/// configured frontend. Requests without an Origin (curl, server-to-server) are allowed.
export const verifyOrigin: RequestHandler = (request, _response, next) => {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    next();
    return;
  }

  const origin = request.headers.origin;

  if (origin && origin !== env.corsOrigin) {
    next(new AppError("Request origin is not allowed.", 403));
    return;
  }

  next();
};
