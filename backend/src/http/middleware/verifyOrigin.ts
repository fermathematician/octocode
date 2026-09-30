import type { RequestHandler } from "express";
import { isAllowedOrigin } from "../origins.js";
import { AppError } from "../../shared/appError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/// CSRF hardening: reject state-changing requests whose browser Origin is not allowed.
/// Requests without an Origin (curl, server-to-server) are permitted.
export const verifyOrigin: RequestHandler = (request, _response, next) => {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    next();
    return;
  }

  const origin = request.headers.origin;

  if (origin && !isAllowedOrigin(origin)) {
    next(new AppError("Request origin is not allowed.", 403));
    return;
  }

  next();
};
