import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "./appError.js";

export function mapPrismaError(error: unknown): AppError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (error.code) {
    case "P2002":
      return new AppError("A record with these values already exists.", 409);
    case "P2025":
      return new AppError("Resource not found.", 404);
    case "P2003":
      return new AppError(
        "This operation conflicts with a related record.",
        409,
      );
    default:
      return null;
  }
}
