import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../../shared/appError.js";

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express detects error handlers by their 4-argument signature.
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Internal server error" });
};
