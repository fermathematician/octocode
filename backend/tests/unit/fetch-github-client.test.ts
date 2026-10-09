import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FetchGithubClient } from "../../src/infrastructure/github/FetchGithubClient.js";
import { AppError } from "../../src/shared/appError.js";

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

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    json: async () => body,
  } as unknown as Response;
}

function makeClient(): FetchGithubClient {
  return new FetchGithubClient({
    clientId: "id",
    clientSecret: "secret",
    callbackUrl: "http://localhost/auth/callback",
  });
}

async function withStubbedFetch(
  handler: (url: string) => Response,
  run: (urls: string[]) => Promise<void>,
): Promise<void> {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];

  globalThis.fetch = (async (input: unknown) => {
    const url = String(input);
    urls.push(url);
    return handler(url);
  }) as unknown as typeof fetch;

  try {
    await run(urls);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

describe("FetchGithubClient.listRepositories", () => {
  it("lists organization repos per org and follows pages", async () => {
    const perPage = 100;
    const pages: Record<number, StubRepository[]> = {
      1: Array.from({ length: perPage }, (_, index) => repository(index + 1)),
      2: [repository(perPage + 1, "beta")],
    };

    await withStubbedFetch(
      (url) => {
        if (url.includes("/user/orgs")) {
          return jsonResponse([{ login: "acme" }]);
        }

        if (url.includes("/orgs/acme/repos")) {
          const page = Number(new URL(url).searchParams.get("page"));
          return jsonResponse(pages[page] ?? []);
        }

        return jsonResponse([]);
      },
      async (urls) => {
        const repositories = await makeClient().listRepositories("token");

        assert.equal(repositories.length, perPage + 1);
        assert.equal(repositories[0]?.owner, "acme");
        assert.equal(repositories[perPage]?.owner, "beta");
        assert.ok(urls.some((url) => url.includes("/orgs/acme/repos")));
        assert.ok(!urls.some((url) => url.includes("/user/repos")));
      },
    );
  });

  it("falls back to the affiliation filter when orgs cannot be listed", async () => {
    await withStubbedFetch(
      (url) => {
        if (url.includes("/user/orgs")) {
          return jsonResponse({ message: "Not Found" }, 404);
        }

        if (url.includes("/user/repos")) {
          return jsonResponse([repository(1)]);
        }

        return jsonResponse([]);
      },
      async (urls) => {
        const repositories = await makeClient().listRepositories("token");

        assert.equal(repositories.length, 1);
        assert.ok(
          urls.some((url) => url.includes("affiliation=organization_member")),
        );
      },
    );
  });

  it("throws an actionable error when every organization is blocked", async () => {
    await withStubbedFetch(
      (url) => {
        if (url.includes("/user/orgs")) {
          return jsonResponse([{ login: "acme" }]);
        }

        return jsonResponse(
          { message: "Resource protected by organization SAML enforcement." },
          403,
          { "x-github-sso": "required; url=https://github.com/orgs/acme/sso" },
        );
      },
      async () => {
        await assert.rejects(
          () => makeClient().listRepositories("token"),
          (error: unknown) =>
            error instanceof AppError &&
            error.statusCode === 403 &&
            /organizations/.test(error.message),
        );
      },
    );
  });
});
