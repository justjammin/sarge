#!/bin/bash
# sarge — compute per-repo status file path.
# Prints absolute path to ~/.claude/.sarge-status-<hash> or empty if not in a git repo.
# Usage:  STATUS=$(bash ~/.claude/hooks/sarge-status-path.sh) && [ -n "$STATUS" ] && echo green > "$STATUS"

REPO=$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null)
[ -z "$REPO" ] && exit 0

# sha1 first 12 hex chars — collision-resistant per-machine
HASH=$(printf '%s' "$REPO" | shasum 2>/dev/null | cut -c1-12)
[ -z "$HASH" ] && exit 0

CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
printf '%s/.sarge-status-%s' "$CONFIG_DIR" "$HASH"
