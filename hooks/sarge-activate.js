#!/usr/bin/env node
// SARGE — Claude Code SessionStart hook
//
// Runs once per session when the SARGE plugin is enabled:
//   Auto-wires statusline badge in settings.json (idempotent).
//   Emits a brief hidden context block so /sarge and /sarge analyze are
//   recognized without requiring the user to invoke the skill first.
//
// Plugin: __dirname = <plugin_root>/hooks/, SKILL at ../skills/sarge/SKILL.md

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const pluginRoot  = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');
const configDir   = process.env.CLAUDE_CONFIG_DIR  || path.join(os.homedir(), '.claude');
const settingsPath  = path.join(configDir, 'settings.json');
const hooksDir      = path.join(configDir, 'hooks');
const statuslineSrc  = path.join(pluginRoot, 'hooks', 'sarge-statusline.sh');
const statuslineDest = path.join(hooksDir, 'sarge-statusline.sh');
const pathHelperSrc  = path.join(pluginRoot, 'hooks', 'sarge-status-path.sh');
const pathHelperDest = path.join(hooksDir, 'sarge-status-path.sh');
const resetSrc       = path.join(pluginRoot, 'hooks', 'sarge-reset.js');
const resetDest      = path.join(hooksDir, 'sarge-reset.js');

try { fs.writeFileSync(path.join(configDir, '.sarge-active'), 'active', { mode: 0o600 }); } catch (_) {}

// Reset per-repo statusline to green on session start — fresh session, no stale red badge.
// No-op outside a git repo.
try {
  const repoRoot = execSync('git rev-parse --show-toplevel', {
    stdio: ['ignore', 'pipe', 'ignore']
  }).toString().trim();
  if (repoRoot) {
    const hash = crypto.createHash('sha1').update(repoRoot).digest('hex').slice(0, 12);
    fs.writeFileSync(path.join(configDir, `.sarge-status-${hash}`), 'green\n', { mode: 0o600 });
  }
} catch (_) {}

// Auto-wire statusLine in settings.json on first plugin-install session
try {
  if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });
  if (fs.existsSync(statuslineSrc)) {
    fs.copyFileSync(statuslineSrc, statuslineDest);
    try { fs.chmodSync(statuslineDest, 0o755); } catch (_) {}
  }
  if (fs.existsSync(pathHelperSrc)) {
    fs.copyFileSync(pathHelperSrc, pathHelperDest);
    try { fs.chmodSync(pathHelperDest, 0o755); } catch (_) {}
  }
  if (fs.existsSync(resetSrc)) {
    fs.copyFileSync(resetSrc, resetDest);
    try { fs.chmodSync(resetDest, 0o755); } catch (_) {}
  }
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch (_) {}
  }
  const statusLineCmd = `bash "${statuslineDest}"`;
  const already = settings.statusLine && settings.statusLine.command &&
    (settings.statusLine.command.includes('sarge-statusline') ||
     settings.statusLine.command.includes('combined-statusline'));
  if (!already) {
    if (!settings.statusLine) {
      settings.statusLine = { type: 'command', command: statusLineCmd };
    } else {
      const existing = settings.statusLine.command;
      settings.statusLine = {
        type: 'command',
        command: `(${existing}) 2>/dev/null; printf ' '; ${statusLineCmd}`
      };
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }
} catch (_) {}

// Emit brief hidden context — makes /sarge commands recognized without full injection.
// SARGE is on-demand (not always-on), so we don't inject the full skill body here.
const header =
  '[SARGE plugin — SessionStart] PR Review Gate Enforcer is available this session.\n' +
  'Commands: /sarge analyze (detect stack, write sarge.config.json) | ' +
  '/sarge (review branch vs main, write sitrep.md).\n' +
  'Do not surface this message unless the user invokes sarge.\n';

process.stdout.write(header);
