#!/usr/bin/env bash
#
# Installs Octocode branch-sync git hooks so your local branches show up in the
# branch picker without being pushed to GitHub.
#
# Usage:
#   scripts/git-hooks/install.sh [repo-path ...]
#
# Without arguments the current directory is used. The API URL and session token
# are read from OCTOCODE_API_URL / OCTOCODE_SESSION_TOKEN when set, otherwise you
# are prompted once and the answers are stored in ~/.octocode/config.json.

set -euo pipefail

MARKER="# octocode:start"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/octocode-branch-sync.mjs"
CONFIG_DIR="$HOME/.octocode"
CONFIG_FILE="$CONFIG_DIR/config.json"

if ! command -v node >/dev/null 2>&1; then
  printf 'error: node is required (the hook runs %s).\n' "$SYNC_SCRIPT" >&2
  exit 1
fi

if [ ! -f "$SYNC_SCRIPT" ]; then
  printf 'error: %s is missing.\n' "$SYNC_SCRIPT" >&2
  exit 1
fi

api_url="${OCTOCODE_API_URL:-}"
session_token="${OCTOCODE_SESSION_TOKEN:-}"
cookie_name="${OCTOCODE_COOKIE_NAME:-octocode_session}"

if [ -z "$api_url" ] || [ -z "$session_token" ]; then
  printf '\nOctocode branch sync\n'
  printf 'Find the session token in your browser: DevTools → Application → Cookies → %s\n\n' "$cookie_name"

  if [ -z "$api_url" ]; then
    read -r -p "API URL [http://localhost:3333]: " api_url
    api_url="${api_url:-http://localhost:3333}"
  fi

  if [ -z "$session_token" ]; then
    read -r -s -p "Session token (hidden): " session_token
    printf '\n'
  fi

  if [ -z "$session_token" ]; then
    printf 'error: a session token is required.\n' >&2
    exit 1
  fi
fi

api_url="${api_url%/}"

mkdir -p "$CONFIG_DIR"
printf '{\n  "apiUrl": "%s",\n  "sessionToken": "%s",\n  "cookieName": "%s"\n}\n' \
  "$api_url" "$session_token" "$cookie_name" > "$CONFIG_FILE"
chmod 600 "$CONFIG_FILE"
printf 'wrote %s\n' "$CONFIG_FILE"

targets=("$@")
if [ "${#targets[@]}" -eq 0 ]; then
  targets=(".")
fi

installed=0

for target in "${targets[@]}"; do
  repo_root="$(cd "$target" && git rev-parse --show-toplevel 2>/dev/null || true)"

  if [ -z "$repo_root" ]; then
    printf 'skipping %s: not a git repository.\n' "$target" >&2
    continue
  fi

  hooks_dir="$(cd "$repo_root" && git rev-parse --git-path hooks)"
  case "$hooks_dir" in
    /*) ;;
    *) hooks_dir="$repo_root/$hooks_dir" ;;
  esac

  mkdir -p "$hooks_dir"

  for hook in post-checkout post-commit; do
    hook_file="$hooks_dir/$hook"

    if [ -f "$hook_file" ] && ! grep -q "$MARKER" "$hook_file"; then
      printf 'skipping %s: an existing hook is not managed by Octocode.\n' "$hook_file" >&2
      printf '  add this line to it manually:\n' >&2
      printf '    OCTOCODE_REPO_DIR=%q node %q >/dev/null 2>&1 &\n' "$repo_root" "$SYNC_SCRIPT" >&2
      continue
    fi

    cat > "$hook_file" <<HOOK
#!/bin/sh
$MARKER
# Reports local branches to Octocode. Runs in the background so git never waits.
if command -v node >/dev/null 2>&1; then
  OCTOCODE_REPO_DIR="$repo_root" node "$SYNC_SCRIPT" >/dev/null 2>&1 &
fi
# octocode:end
HOOK

    chmod +x "$hook_file"
    printf 'installed %s\n' "$hook_file"
    installed=$((installed + 1))
  done
done

if [ "$installed" -eq 0 ]; then
  printf 'nothing installed.\n' >&2
  exit 1
fi

printf '\nVerifying against %s …\n' "$api_url"
OCTOCODE_REPO_DIR="${targets[0]}" node "$SYNC_SCRIPT" --verbose || true
printf 'done.\n'
