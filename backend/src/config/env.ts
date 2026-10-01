import "dotenv/config";

function readRequired(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }

  return value;
}

function readOptional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return value;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  throw new Error(`Environment variable ${name} must be "true" or "false".`);
}

function readUrl(name: string, fallback: string): string {
  const value = readOptional(name, fallback);

  try {
    new URL(value);
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL.`);
  }

  return value;
}

function readEncryptionKey(): string {
  const value = readRequired("TOKEN_ENCRYPTION_KEY");
  const key = Buffer.from(value, "base64");

  if (key.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
    );
  }

  return value;
}

export const env = {
  isProduction: readOptional("NODE_ENV", "development") === "production",
  isTest: readOptional("NODE_ENV", "development") === "test",
  // Trust the first proxy (needed for correct client IPs / rate limiting behind Render).
  trustProxy: readBoolean("TRUST_PROXY", false),
  port: readNumber("PORT", 3333),
  frontendUrl: readUrl("FRONTEND_URL", "http://localhost:5173"),
  corsOrigin: readUrl("CORS_ORIGIN", "http://localhost:5173"),
  tokenEncryptionKey: readEncryptionKey(),
  // Dev-only: allow signing in with a GitHub personal access token (no OAuth App).
  allowDevTokenLogin: readBoolean("ALLOW_DEV_TOKEN_LOGIN", false),
  github: {
    clientId: readOptional("GITHUB_CLIENT_ID", ""),
    clientSecret: readOptional("GITHUB_CLIENT_SECRET", ""),
    callbackUrl: readUrl(
      "GITHUB_OAUTH_CALLBACK_URL",
      "http://localhost:3333/auth/github/callback",
    ),
    // Secret configured on the repository webhook. Empty disables the endpoint.
    webhookSecret: readOptional("GITHUB_WEBHOOK_SECRET", ""),
    commitSyncIntervalMs: readNumber(
      "GITHUB_COMMIT_SYNC_INTERVAL_MS",
      5 * 60 * 1000,
    ),
  },
  google: {
    clientId: readOptional("GOOGLE_CLIENT_ID", ""),
    clientSecret: readOptional("GOOGLE_CLIENT_SECRET", ""),
    callbackUrl: readUrl(
      "GOOGLE_OAUTH_CALLBACK_URL",
      "http://localhost:3333/calendar/google/callback",
    ),
    timeZone: readOptional("GOOGLE_CALENDAR_TIME_ZONE", "UTC"),
    syncIntervalMs: readNumber(
      "GOOGLE_CALENDAR_SYNC_INTERVAL_MS",
      15 * 60 * 1000,
    ),
  },
  session: {
    cookieName: readOptional("SESSION_COOKIE_NAME", "octocode_session"),
    ttlDays: readNumber("SESSION_TTL_DAYS", 30),
    secure: readBoolean("COOKIE_SECURE", false),
    cleanupIntervalMs: readNumber(
      "SESSION_CLEANUP_INTERVAL_MS",
      6 * 60 * 60 * 1000,
    ),
  },
  rateLimit: {
    windowMs: readNumber("RATE_LIMIT_WINDOW_MS", 60_000),
    max: readNumber("RATE_LIMIT_MAX", 300),
    authMax: readNumber("RATE_LIMIT_AUTH_MAX", 20),
  },
} as const;
