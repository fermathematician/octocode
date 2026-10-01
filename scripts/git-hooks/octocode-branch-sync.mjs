#!/usr/bin/env node
// Reports the current repository's local branches to Octocode, so they show up
// in the branch picker before they are pushed to GitHub.
//
// Usage:
//   octocode-branch-sync.mjs [--verbose]
//
// Configuration (environment wins over the config file):
//   OCTOCODE_API_URL         e.g. https://octocode-api.onrender.com
//   OCTOCODE_SESSION_TOKEN   the `octocode_session` cookie value
//   OCTOCODE_COOKIE_NAME     defaults to octocode_session
//   OCTOCODE_REPO_DIR        repository to inspect, defaults to the cwd
//   OCTOCODE_DEBUG=1         same as --verbose
//
// Config file: ~/.octocode/config.json
//   { "apiUrl": "…", "sessionToken": "…", "cookieName": "octocode_session" }
//
// This script always exits 0 and stays quiet unless --verbose is passed, so it
// is safe to call from a git hook.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const verbose =
  process.argv.includes("--verbose") || process.env.OCTOCODE_DEBUG === "1";

const DEFAULT_COOKIE_NAME = "octocode_session";
const MAX_BRANCHES = 500;

function log(message) {
  if (verbose) {
    process.stderr.write(`octocode: ${message}\n`);
  }
}

function readConfigFile() {
  try {
    const raw = readFileSync(
      join(homedir(), ".octocode", "config.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/** Extracts `{ owner, name }` from an scp-style or URL git remote. */
function parseRemote(url) {
  const cleaned = url.trim().replace(/\.git$/, "");
  const scp = cleaned.match(/^[^@/]+@[^:]+:(.+)$/);
  let path;

  if (scp) {
    path = scp[1];
  } else {
    try {
      path = new URL(cleaned).pathname;
    } catch {
      return null;
    }
  }

  const parts = path.split("/").filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  return {
    owner: parts[parts.length - 2],
    name: parts[parts.length - 1],
  };
}

function readSettings() {
  const config = readConfigFile();

  return {
    apiUrl: String(process.env.OCTOCODE_API_URL || config.apiUrl || "")
      .trim()
      .replace(/\/+$/, ""),
    sessionToken: String(
      process.env.OCTOCODE_SESSION_TOKEN || config.sessionToken || "",
    ).trim(),
    cookieName: String(
      process.env.OCTOCODE_COOKIE_NAME || config.cookieName || DEFAULT_COOKIE_NAME,
    ).trim(),
    repoDir: process.env.OCTOCODE_REPO_DIR || process.cwd(),
  };
}

async function main() {
  const settings = readSettings();

  if (!settings.apiUrl || !settings.sessionToken) {
    log(
      "skipped: set OCTOCODE_API_URL and OCTOCODE_SESSION_TOKEN, or run scripts/git-hooks/install.sh",
    );
    return;
  }

  const remoteUrl = git(["remote", "get-url", "origin"], settings.repoDir);
  const repository = parseRemote(remoteUrl);

  if (!repository) {
    log(`skipped: cannot read a GitHub remote from "${remoteUrl}"`);
    return;
  }

  const names = git(
    ["for-each-ref", "--format=%(refname:short)", "refs/heads"],
    settings.repoDir,
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_BRANCHES);

  if (names.length === 0) {
    log("skipped: no local branches");
    return;
  }

  const response = await fetch(`${settings.apiUrl}/github/branches/local`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${settings.cookieName}=${settings.sessionToken}`,
    },
    body: JSON.stringify({
      owner: repository.owner,
      name: repository.name,
      names,
    }),
  });

  if (!response.ok) {
    log(`failed: ${response.status} ${await response.text()}`);
    return;
  }

  const result = await response.json();
  log(
    `recorded ${result.recorded} local branch(es) for ${repository.owner}/${repository.name}`,
  );
}

main().catch((error) => {
  log(`failed: ${error instanceof Error ? error.message : String(error)}`);
});
