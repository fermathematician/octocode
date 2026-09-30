import "dotenv/config";

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  isProduction: optional("NODE_ENV", "development") === "production",
  port: Number(optional("PORT", "3333")),
  frontendUrl: optional("FRONTEND_URL", "http://localhost:5173"),
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:5173"),
  tokenEncryptionKey: required("TOKEN_ENCRYPTION_KEY"),
  github: {
    clientId: optional("GITHUB_CLIENT_ID", ""),
    clientSecret: optional("GITHUB_CLIENT_SECRET", ""),
    callbackUrl: optional(
      "GITHUB_OAUTH_CALLBACK_URL",
      "http://localhost:3333/auth/github/callback",
    ),
  },
  session: {
    cookieName: optional("SESSION_COOKIE_NAME", "octocode_session"),
    ttlDays: Number(optional("SESSION_TTL_DAYS", "30")),
    secure: optional("COOKIE_SECURE", "false") === "true",
  },
} as const;
