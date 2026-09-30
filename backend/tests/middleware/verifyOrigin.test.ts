import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import express from "express";
import { errorHandler } from "../../src/http/middleware/errorHandler.js";
import { verifyOrigin } from "../../src/http/middleware/verifyOrigin.js";

describe("verifyOrigin", () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = express();
    app.use(verifyOrigin);
    app.get("/read", (_request, response) => {
      response.status(204).end();
    });
    app.post("/mutate", (_request, response) => {
      response.status(204).end();
    });
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("allows safe methods", async () => {
    const response = await fetch(`${baseUrl}/read`, {
      headers: { Origin: "http://evil.example" },
    });
    assert.equal(response.status, 204);
  });

  it("allows the configured origin", async () => {
    const response = await fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: { Origin: "http://localhost:5173" },
    });
    assert.equal(response.status, 204);
  });

  it("rejects a foreign origin", async () => {
    const response = await fetch(`${baseUrl}/mutate`, {
      method: "POST",
      headers: { Origin: "http://evil.example" },
    });
    assert.equal(response.status, 403);
  });

  it("allows requests without an origin", async () => {
    const response = await fetch(`${baseUrl}/mutate`, { method: "POST" });
    assert.equal(response.status, 204);
  });
});
