import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../../shared/appError.js";
import { mapPrismaError } from "../../shared/prismaErrors.js";

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({ message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express detects error handlers by their 4-argument signature.
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ message: "Malformed JSON body." });
    return;
  }

  const mapped = mapPrismaError(error);

  if (mapped) {
    response.status(mapped.statusCode).json({ message: mapped.message });
    return;
  }

  console.error(
    JSON.stringify({
      level: "error",
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }),
  );
  response.status(500).json({ message: "Internal server error" });
};
