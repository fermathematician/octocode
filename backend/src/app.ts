import express from "express";
import { apiRouter, ensureAuthenticated } from "./composition/index.js";
import { env } from "./config/env.js";
import { prisma } from "./infrastructure/prisma/client.js";
import { cors } from "./http/middleware/cors.js";
import {
  errorHandler,
  notFoundHandler,
} from "./http/middleware/errorHandler.js";
import { createRateLimiter } from "./http/middleware/rateLimit.js";
import { requestLogger } from "./http/middleware/requestLogger.js";
import { verifyOrigin } from "./http/middleware/verifyOrigin.js";

export const app = express();

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(requestLogger);
app.use(cors);
app.use(verifyOrigin);

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ready" });
  } catch {
    response.status(503).json({ status: "unavailable" });
  }
});

app.use(
  createRateLimiter({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
  }),
);
app.use(
  "/auth",
  createRateLimiter({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.authMax,
  }),
);

app.use(
  express.json({
    verify: (request, _response, buffer) => {
      // Keep the raw body so the GitHub webhook signature can be verified.
      (request as { rawBody?: Buffer }).rawBody = buffer;
    },
  }),
);
app.use(ensureAuthenticated);
app.use(apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
