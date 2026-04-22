# SARGE

**Static Analysis & Review Gate Enforcer**

Run it before you submit. Catch what reviewers shouldn't have to catch.

---

## What it does

SARGE diffs your committed changes against `main`, runs static analysis for your stack, traces blast radius on high-risk changes, runs affected tests, and writes a ranked report — P0, P1, P2.

Two commands:

```bash
/sarge analyze   # Detect stack → write sarge.config.json
/sarge           # Review branch vs main → write sitrep.md
```

---

## Philosophy

Shift-left. Catch issues before review, not during. Correctness → Security → Maintainability.

SARGE reports. It never auto-fixes. You own the fix.

---

## Severity

| Tier | Meaning | Status |
|------|---------|--------|
| **P0** | Security risk or correctness failure. Blocks merge. | 🔴 |
| **P1** | Standards violation or maintainability debt. Blocks merge. | 🔴 |
| **P2** | Hygiene. Non-blocking. | 🟡 |

Green = P0 zero and P1 zero.

---

## Stack

| Language | Tools |
|----------|-------|
| PHP / WordPress | PHPCS, PHPStan, PHPMD, WPCS |
| JavaScript | ESLint |
| TypeScript | ESLint, tsc --noEmit |
| Python | Ruff, Mypy |

Missing binary → SARGE skips it and notes the gap. The run completes regardless.

---

## Checks

**P0:** SQL injection, XSS, missing nonce verification, missing capability checks, hardcoded secrets, `eval()`.

**P1:** Coding standards, missing return types, deprecated functions, unhandled async errors.

**P2:** Unused variables, unused exports, missing docblocks.

---

## Impact tracing

SARGE traces callers for public API signature changes, WordPress hook modifications, and exported function changes. Private functions and style-only diffs are skipped.

Blast radius shows up in every SITREP under `## BLAST RADIUS`.

---

## SITREP format

Each run prepends a new block to `sitrep.md`. Previous runs compress to one-line summaries so the file stays readable across iterations.

```markdown
## SITREP [2026-04-22 14:30] | branch: feature/checkout | commit: abc1234
**STATUS: 🔴 RED** | P0: 1 | P1: 2 | P2: 0

### P0 ISSUES
- `src/Cart.php:87` No nonce check. Fix: add `check_ajax_referer('action','nonce')`

### BLAST RADIUS
- `get_price()` sig changed → 4 callers: Checkout.php:12, Cart.php:44, ...

### TESTS
- PHPUnit: 3 run, 3 pass ✅

<!-- COMPRESSED: [2026-04-21 11:02] 🟡 P0:0 P1:0 P2:2 | fixed: unused vars -->
```

---

## Install

```bash
git clone https://github.com/justjammin/sarge
node sarge/install.js
```

Or via npm:

```bash
npx sarge-ai
```

Skill lands in `~/.claude/skills/sarge/`. StatusLine badge is wired automatically.

---

## StatusLine

After each run, SARGE writes the result to `~/.claude/.sarge-status`. Persists across sessions.

```
🔴[SARGE]   P0 or P1 issues found
🟡[SARGE]   P2 only
🟢[SARGE]   Clean
```

---

## Config

`sarge.config.json` lives at the repo root — commit it so the whole team shares the baseline. `sarge analyze` is re-runnable; manual overrides survive.

Add `sitrep.md` to `.gitignore` for a local artifact, or commit it for team visibility across runs.

---

## Requirements

- Claude Code
- Node.js 16+
- The static analysis tools for your stack — PHPCS, PHPStan, ESLint, tsc, ruff, mypy. Install what you need.

---

## License

MIT
