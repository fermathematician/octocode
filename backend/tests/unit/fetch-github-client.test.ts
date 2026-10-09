import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FetchGithubClient } from "../../src/infrastructure/github/FetchGithubClient.js";

interface StubRepository {
  id: number;
  name: string;
  default_branch: string;
  private: boolean;
  owner: { login: string };
}

function repository(id: number, owner = "acme"): StubRepository {
  return {
    id,
    name: `repo-${id}`,
    default_branch: "main",
    private: false,
    owner: { login: owner },
  };
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

describe("FetchGithubClient.listRepositories", () => {
  it("requests only organization repos and follows pages", async () => {
    const urls: string[] = [];
    const perPage = 100;
    const pages: Record<number, StubRepository[]> = {
      1: Array.from({ length: perPage }, (_, index) => repository(index + 1)),
      2: [repository(perPage + 1, "beta")],
    };
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: unknown) => {
      const url = String(input);
      urls.push(url);
      const page = Number(new URL(url).searchParams.get("page"));
      return jsonResponse(pages[page] ?? []);
    }) as unknown as typeof fetch;

    try {
      const client = new FetchGithubClient({
        clientId: "id",
        clientSecret: "secret",
        callbackUrl: "http://localhost/auth/callback",
      });

      const repositories = await client.listRepositories("token");

      assert.equal(repositories.length, perPage + 1);
      assert.equal(repositories[0]?.owner, "acme");
      assert.equal(repositories[perPage]?.owner, "beta");
      assert.equal(urls.length, 2);

      const firstUrl = urls[0];
      const secondUrl = urls[1];
      assert.ok(firstUrl);
      assert.ok(secondUrl);
      assert.match(firstUrl, /affiliation=organization_member/);
      assert.match(firstUrl, /page=1/);
      assert.match(secondUrl, /page=2/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("stops after a single short page", async () => {
    const urls: string[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: unknown) => {
      urls.push(String(input));
      return jsonResponse([repository(1)]);
    }) as unknown as typeof fetch;

    try {
      const client = new FetchGithubClient({
        clientId: "id",
        clientSecret: "secret",
        callbackUrl: "http://localhost/auth/callback",
      });

      const repositories = await client.listRepositories("token");

      assert.equal(repositories.length, 1);
      assert.equal(urls.length, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
