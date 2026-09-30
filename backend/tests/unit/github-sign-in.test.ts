import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SessionProvider } from "../../src/infrastructure/auth/SessionProvider.js";
import type { TokenCipher } from "../../src/infrastructure/auth/TokenCipher.js";
import type { GithubClient } from "../../src/infrastructure/github/GithubClient.js";
import { GithubSignInService } from "../../src/modules/auth/services/GithubSignInService.js";
import {
  InMemoryOAuthAccountRepository,
  InMemoryStore,
  InMemoryUserRepository,
} from "../support/fakes.js";

function makeService() {
  const store = new InMemoryStore();
  const users = new InMemoryUserRepository(store);
  const oauthAccounts = new InMemoryOAuthAccountRepository();
  const encrypted: string[] = [];

  const tokenCipher = {
    encrypt: (value: string) => {
      encrypted.push(value);
      return `enc:${value}`;
    },
  } as unknown as TokenCipher;

  const sessions = {
    create: async () => ({
      token: "session-token",
      expiresAt: new Date(Date.now() + 60_000),
    }),
  } as unknown as SessionProvider;

  const githubClient = {
    getAuthenticatedUser: async () => ({
      id: "1",
      login: "gabriel",
      name: "Gabriel",
      email: null,
      avatarUrl: null,
    }),
  } as unknown as GithubClient;

  const service = new GithubSignInService(
    githubClient,
    tokenCipher,
    users,
    oauthAccounts,
    sessions,
  );

  return { store, oauthAccounts, encrypted, service };
}

describe("GithubSignInService", () => {
  it("creates a user, stores an encrypted token, and starts a session", async () => {
    const { store, oauthAccounts, encrypted, service } = makeService();

    const result = await service.execute({ accessToken: "ghp_secret" });

    assert.equal(result.user.login, "gabriel");
    assert.equal(result.sessionToken, "session-token");
    assert.deepEqual(encrypted, ["ghp_secret"]);
    assert.equal(store.users.length, 1);

    const account = await oauthAccounts.findByProviderAccount("GITHUB", "1");
    assert.equal(account?.accessToken, "enc:ghp_secret");
  });

  it("reuses an existing user matched by GitHub account", async () => {
    const { store, oauthAccounts, service } = makeService();
    const user = store.seedUser({ login: "gabriel" });

    await oauthAccounts.save({
      userId: user.id,
      provider: "GITHUB",
      providerAccountId: "1",
      accessToken: "enc:old",
      refreshToken: null,
      tokenType: null,
      scope: "",
      expiresAt: null,
    });

    await service.execute({ accessToken: "ghp_new" });

    assert.equal(store.users.length, 1);
    const account = await oauthAccounts.findByProviderAccount("GITHUB", "1");
    assert.equal(account?.accessToken, "enc:ghp_new");
  });
});
