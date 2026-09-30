import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Prisma } from "../../src/generated/prisma/client.js";
import { mapPrismaError } from "../../src/shared/prismaErrors.js";

function knownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("boom", {
    code,
    clientVersion: "test",
  });
}

describe("mapPrismaError", () => {
  it("maps P2002 to 409", () => {
    const mapped = mapPrismaError(knownError("P2002"));
    assert.equal(mapped?.statusCode, 409);
  });

  it("maps P2025 to 404", () => {
    const mapped = mapPrismaError(knownError("P2025"));
    assert.equal(mapped?.statusCode, 404);
  });

  it("maps P2003 to 409", () => {
    const mapped = mapPrismaError(knownError("P2003"));
    assert.equal(mapped?.statusCode, 409);
  });

  it("ignores unknown Prisma codes", () => {
    assert.equal(mapPrismaError(knownError("P9999")), null);
  });

  it("ignores non-Prisma errors", () => {
    assert.equal(mapPrismaError(new Error("plain")), null);
    assert.equal(mapPrismaError("string"), null);
  });
});
