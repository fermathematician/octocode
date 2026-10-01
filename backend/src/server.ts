import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { backgroundCommitSync } from "./composition/github.js";
import { syncAllCalendars } from "./composition/index.js";
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

async function syncCalendars(): Promise<void> {
  try {
    await syncAllCalendars.execute();
  } catch (error) {
    console.error("Calendar sync job failed.", error);
  }
}

const calendarSyncTimer = setInterval(() => {
  void syncCalendars();
}, env.google.syncIntervalMs);
calendarSyncTimer.unref();

async function syncCommits(): Promise<void> {
  try {
    await backgroundCommitSync.executeAll();
  } catch (error) {
    console.error("Commit sync job failed.", error);
  }
}

const commitSyncTimer = setInterval(() => {
  void syncCommits();
}, env.github.commitSyncIntervalMs);
commitSyncTimer.unref();

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down…`);
  clearInterval(cleanupTimer);
  clearInterval(calendarSyncTimer);
  clearInterval(commitSyncTimer);

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
