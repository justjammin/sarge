#!/bin/bash
# sarge — statusline badge script for Claude Code
# Shows 🔴/🟡/🟢[SARGE] reflecting last review run status.
#
# Usage in ~/.claude/settings.json:
#   "statusLine": { "type": "command", "command": "bash /path/to/sarge-statusline.sh" }
#
# Installed automatically by install.js.

SARGE_STATUS="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/.sarge-status"

# Refuse symlinks — prevents terminal-escape injection via flag file contents.
[ -L "$SARGE_STATUS" ] && exit 0
[ ! -f "$SARGE_STATUS" ] && exit 0

STATUS=$(head -c 16 "$SARGE_STATUS" 2>/dev/null | tr -d '\n\r ' | tr '[:upper:]' '[:lower:]')
STATUS=$(printf '%s' "$STATUS" | tr -cd 'a-z')

case "$STATUS" in
  red)    printf '🔴\033[38;5;196m[SARGE]\033[0m' ;;
  yellow) printf '🟡\033[38;5;226m[SARGE]\033[0m' ;;
  green)  printf '🟢\033[38;5;46m[SARGE]\033[0m' ;;
  *)      printf '\033[38;5;244m[SARGE]\033[0m' ;;
esac
