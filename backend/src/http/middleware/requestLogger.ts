import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../../config/env.js";

export const requestLogger: RequestHandler = (request, response, next) => {
  const requestId = randomUUID();
  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);

  const startedAt = Date.now();

  if (!env.isTest) {
    response.on("finish", () => {
      console.log(
        JSON.stringify({
          level: "info",
          requestId,
          method: request.method,
          path: request.originalUrl,
          status: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });
  }

  next();
};
