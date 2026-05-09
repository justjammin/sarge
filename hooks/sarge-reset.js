#!/usr/bin/env node
// SARGE — SessionEnd / SessionStart status reset hook
//
// Writes 'green' to ~/.claude/.sarge-status-<hash> for the current repo so the
// statusline starts each session clean. SARGE is per-branch + per-run; stale
// red badges from a prior session are misleading.
//
// No-op if not in a git repo (no per-repo file to write).

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

let repoRoot = '';
try {
  repoRoot = execSync('git rev-parse --show-toplevel', {
    stdio: ['ignore', 'pipe', 'ignore']
  }).toString().trim();
} catch (_) {}

if (!repoRoot) process.exit(0);

const hash = crypto.createHash('sha1').update(repoRoot).digest('hex').slice(0, 12);
const statusFile = path.join(configDir, `.sarge-status-${hash}`);

try {
  fs.writeFileSync(statusFile, 'green\n', { mode: 0o600 });
} catch (_) {}
