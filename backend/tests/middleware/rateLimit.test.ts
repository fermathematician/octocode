import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { Server } from "node:http";
import express from "express";
import { createRateLimiter } from "../../src/http/middleware/rateLimit.js";

describe("createRateLimiter", () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = express();
    app.use(createRateLimiter({ windowMs: 60_000, max: 2 }));
    app.get("/ping", (_request, response) => {
      response.json({ ok: true });
    });

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

  it("allows up to the max, then returns 429 with Retry-After", async () => {
    assert.equal((await fetch(`${baseUrl}/ping`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/ping`)).status, 200);

    const limited = await fetch(`${baseUrl}/ping`);
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get("retry-after"));
  });
});
