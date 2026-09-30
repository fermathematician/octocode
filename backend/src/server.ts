import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { sessionProvider } from "./composition/shared.js";
import { prisma } from "./infrastructure/prisma/client.js";

const server = app.listen(env.port, () => {
  console.log(`HTTP server running on ${env.port}`);
});

async function cleanupSessions(): Promise<void> {
  try {
    const removed = await sessionProvider.deleteExpired();

    if (removed > 0) {
      console.log(`Removed ${removed} expired or revoked session(s).`);
    }
  } catch (error) {
    console.error("Session cleanup failed.", error);
  }
}

void cleanupSessions();

const cleanupTimer = setInterval(() => {
  void cleanupSessions();
}, env.session.cleanupIntervalMs);
cleanupTimer.unref();

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down…`);
  clearInterval(cleanupTimer);

  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  shutdown("SIGINT");
});
