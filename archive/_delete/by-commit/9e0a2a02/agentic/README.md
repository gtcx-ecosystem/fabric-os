---
title: agentic/ — thin bridge to baseline-os + bridge-os
status: current
date: 2026-06-08
owner: fabric-os
document_id: AGENTIC-BRIDGE-001
review_cycle: on-change
---

# agentic/ — thin bridge to baseline-os + bridge-os

This directory is the **only** local connection point from `fabric-os` to the ecosystem agent stack.

| Target          | Path             | Role                                                   |
| --------------- | ---------------- | ------------------------------------------------------ |
| **baseline-os** | `../baseline-os` | Agent runtime — session, next, gates, hub              |
| **bridge-os**   | `../bridge-os`   | Ecosystem program office — ZenHub, rollouts, P35 gates |

**Contents:** `README.md` + `manifest.json` only — no scripts, no nested `platform/`, no fat hub.

**Mnemonic:** `session → next → gates → hub` (baseline-os verbs in root `package.json`).

**Ecosystem PM / ZenHub:** see `manifest.json` → `bridge-os.verbs` (e.g. `pnpm --dir ../bridge-os ecosystem:zenhub:status`).

**Skills (superpowers + frontend-design):** SoR is **`../bridge-os/docs/skills/`** only. This repo holds symlinks (`.cursor/rules/skill-*.mdc`, `.claude/skills/`) — refresh via `pnpm --dir ../bridge-os ecosystem:skills:rollout -- --repo fabric-os`.

**Session validation (commit · push · ZenHub · skills · terminal):**

```bash
pnpm session                                    # baseline-os — P22 + P26 + P27 autonomy
pnpm --dir ../bridge-os ecosystem:fleet:readiness -- --repo fabric-os --quick
pnpm --dir ../bridge-os ecosystem:zenhub:status  # all repos on GTCX board
```

**Agent terminal (P27 — agents run commands in-session, not operator paste):**

Cursor IDE uses repo `.cursor/cli.json` + `.cursor/permissions.json` (rolled out from baseline-os templates). Refresh:

```bash
pnpm --dir ../bridge-os ecosystem:cursor:rollout -- --repo fabric-os
node ../baseline-os/platform/scripts/ecosystem/lib/agent-environment-autonomy.mjs --repo-path=.
```

Cursor CLI uses `~/.cursor/cli-config.json` — set `permissions.allow` to include `Shell(**)` or `approvalMode: unrestricted`.

Local work SoR remains **`pm/`** in this repo. Ecosystem-wide plan SoR is **`../bridge-os/pm/`**.
