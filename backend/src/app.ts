import express from "express";
import { apiRouter, ensureAuthenticated } from "./composition/index.js";
import { cors } from "./http/middleware/cors.js";
import { errorHandler, notFoundHandler } from "./http/middleware/errorHandler.js";

export const app = express();

app.use(cors);
app.use(express.json());
app.use(ensureAuthenticated);

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use(apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
