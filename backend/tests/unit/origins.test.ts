import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { env } from "../../src/config/env.js";
import { isAllowedOrigin } from "../../src/http/origins.js";

describe("isAllowedOrigin", () => {
  it("allows the configured origin", () => {
    assert.equal(isAllowedOrigin(env.corsOrigin), true);
  });

  it("allows other localhost origins in development", () => {
    assert.equal(isAllowedOrigin("http://localhost:5174"), true);
    assert.equal(isAllowedOrigin("http://127.0.0.1:3000"), true);
    assert.equal(isAllowedOrigin("https://localhost:8443"), true);
  });

  it("rejects foreign origins", () => {
    assert.equal(isAllowedOrigin("http://evil.example"), false);
    assert.equal(isAllowedOrigin("https://localhost.evil.example"), false);
  });
});
