#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_SRC        = path.join(__dirname, 'skills', 'sarge', 'SKILL.md');
const CLAUDE_DIR       = path.join(os.homedir(), '.claude');
const CLAUDE_SKILLS_DIR = path.join(CLAUDE_DIR, 'skills', 'sarge');
const SKILL_DEST       = path.join(CLAUDE_SKILLS_DIR, 'SKILL.md');
const SETTINGS_PATH    = path.join(CLAUDE_DIR, 'settings.json');
const HOOKS_DIR        = path.join(CLAUDE_DIR, 'hooks');
const STATUSLINE_SRC   = path.join(__dirname, 'hooks', 'sarge-statusline.sh');
const STATUSLINE_DEST  = path.join(HOOKS_DIR, 'sarge-statusline.sh');
const PATH_HELPER_SRC  = path.join(__dirname, 'hooks', 'sarge-status-path.sh');
const PATH_HELPER_DEST = path.join(HOOKS_DIR, 'sarge-status-path.sh');
const RESET_SRC        = path.join(__dirname, 'hooks', 'sarge-reset.js');
const RESET_DEST       = path.join(HOOKS_DIR, 'sarge-reset.js');
const HOOK_COMMAND     = `node "${path.join(__dirname, 'hooks', 'sarge-activate.js')}"`;
const RESET_COMMAND    = `node "${RESET_DEST}"`;


function install() {
  if (!fs.existsSync(CLAUDE_DIR)) {
    console.error('Error: Claude Code not found. Install from https://claude.ai/code first.');
    process.exit(1);
  }

  // Copy skill
  if (!fs.existsSync(CLAUDE_SKILLS_DIR)) {
    fs.mkdirSync(CLAUDE_SKILLS_DIR, { recursive: true });
  }
  fs.copyFileSync(SKILL_SRC, SKILL_DEST);
  console.log('  Skill: ~/.claude/skills/sarge/SKILL.md');

  // Copy statusline script
  if (!fs.existsSync(HOOKS_DIR)) {
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
  }
  fs.copyFileSync(STATUSLINE_SRC, STATUSLINE_DEST);
  try { fs.chmodSync(STATUSLINE_DEST, 0o755); } catch (_) {}
  console.log('  Hook:  hooks/sarge-statusline.sh');

  // Copy per-repo status path helper (used by statusline + skill writes)
  if (fs.existsSync(PATH_HELPER_SRC)) {
    fs.copyFileSync(PATH_HELPER_SRC, PATH_HELPER_DEST);
    try { fs.chmodSync(PATH_HELPER_DEST, 0o755); } catch (_) {}
    console.log('  Hook:  hooks/sarge-status-path.sh');
  }

  // Copy reset script (used by SessionEnd + SessionStart to clear stale red badge)
  if (fs.existsSync(RESET_SRC)) {
    fs.copyFileSync(RESET_SRC, RESET_DEST);
    try { fs.chmodSync(RESET_DEST, 0o755); } catch (_) {}
    console.log('  Hook:  hooks/sarge-reset.js');
  }


  // Wire statusLine in settings.json
  let settings = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    try { settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch (_) {}
  }

  const statusLineCmd = `bash "${STATUSLINE_DEST}"`;
  if (!settings.statusLine) {
    settings.statusLine = { type: 'command', command: statusLineCmd };
    console.log('  Status: statusLine → hooks/sarge-statusline.sh');
  } else if (settings.statusLine.command && !settings.statusLine.command.includes('sarge-statusline')) {
    const existing = settings.statusLine.command;
    settings.statusLine = {
      type: 'command',
      command: `(${existing}) 2>/dev/null; printf ' '; ${statusLineCmd}`
    };
    console.log('  Status: [SARGE] badge chained to existing statusLine');
  } else {
    console.log('  Status: [SARGE] badge already in statusLine (skipped)');
  }

  // Register SessionStart hook
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];

  const alreadyRegistered = settings.hooks.SessionStart.some(
    entry => entry.hooks && entry.hooks.some(h => h.command && h.command.includes('sarge-activate.js'))
  );

  if (!alreadyRegistered) {
    settings.hooks.SessionStart.push({
      hooks: [{
        type: 'command',
        command: HOOK_COMMAND,
        timeout: 10,
        statusMessage: 'Loading SARGE...'
      }]
    });
    console.log('  Hook:  SessionStart → hooks/sarge-activate.js');
  } else {
    console.log('  Hook:  SessionStart already registered (skipped)');
  }

  // Register SessionEnd hook → reset status to green so next session starts clean
  if (!settings.hooks.SessionEnd) settings.hooks.SessionEnd = [];

  const resetRegistered = settings.hooks.SessionEnd.some(
    entry => entry.hooks && entry.hooks.some(h => h.command && h.command.includes('sarge-reset.js'))
  );

  if (!resetRegistered) {
    settings.hooks.SessionEnd.push({
      hooks: [{
        type: 'command',
        command: RESET_COMMAND,
        timeout: 5
      }]
    });
    console.log('  Hook:  SessionEnd → hooks/sarge-reset.js');
  } else {
    console.log('  Hook:  SessionEnd already registered (skipped)');
  }

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');

  console.log('');
  console.log('SARGE installed.');
  console.log('');
  console.log('Usage:');
  console.log('  /sarge analyze   Detect stack, write sarge.config.json');
  console.log('  /sarge           Review current branch vs main, write sitrep.md');
  console.log('');
  console.log('Commit sarge.config.json. Add sitrep.md to .gitignore (or commit for team visibility).');
  console.log('');
}

install();
