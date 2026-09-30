import type { RequestHandler } from "express";
import { env } from "../../config/env.js";

export const cors: RequestHandler = (request, response, next) => {
  const origin = request.headers.origin;

  if (origin && origin === env.corsOrigin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Vary", "Origin");
  }

  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  );
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
};
