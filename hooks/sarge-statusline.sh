#!/bin/bash
# sarge — statusline badge script for Claude Code
# Shows 🔴/🟡/🟢[SARGE] reflecting last review run status for the *current repo*.
#
# Usage in ~/.claude/settings.json:
#   "statusLine": { "type": "command", "command": "bash /path/to/sarge-statusline.sh" }
#
# Installed automatically by install.js.

CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
PATH_HELPER="$CONFIG_DIR/hooks/sarge-status-path.sh"

# Resolve per-repo status file (empty if not in a git repo)
SARGE_STATUS=""
if [ -x "$PATH_HELPER" ]; then
  SARGE_STATUS=$(bash "$PATH_HELPER" 2>/dev/null)
fi

# Not in a repo, or helper missing → render neutral grey badge
if [ -z "$SARGE_STATUS" ]; then
  printf '\033[38;5;244m[SARGE]\033[0m'
  exit 0
fi

# Refuse symlinks — prevents terminal-escape injection via flag file contents.
[ -L "$SARGE_STATUS" ] && exit 0
[ ! -f "$SARGE_STATUS" ] && {
  printf '\033[38;5;244m[SARGE]\033[0m'
  exit 0
}

STATUS=$(head -c 16 "$SARGE_STATUS" 2>/dev/null | tr -d '\n\r ' | tr '[:upper:]' '[:lower:]')
STATUS=$(printf '%s' "$STATUS" | tr -cd 'a-z')

case "$STATUS" in
  red)    printf '🔴\033[38;5;196m[SARGE]\033[0m' ;;
  yellow) printf '🟡\033[38;5;226m[SARGE]\033[0m' ;;
  green)  printf '🟢\033[38;5;46m[SARGE]\033[0m' ;;
  *)      printf '\033[38;5;244m[SARGE]\033[0m' ;;
esac
