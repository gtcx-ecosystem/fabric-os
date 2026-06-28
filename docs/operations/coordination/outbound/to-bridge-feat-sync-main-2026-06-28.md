---
title: 'Outbound — bridge-os feat/ai-cost-manifest-proof is 24 commits behind main (live tooling stale)'
status: sent
date: 2026-06-28
from: fabric-os
to: [bridge-os]
ticket: XR-BRIDGE-FEAT-SYNC-001
authorityClass: A
protocol: P24
blocksIR: false
owner: bridge-os
---

# To bridge-os — sync `feat/ai-cost-manifest-proof` with `main` (live tooling is stale)

**One-line read:** every repo's pre-commit gate + rollout reads bridge-os's **working tree**
(`feat/ai-cost-manifest-proof`), which is **24 commits behind `origin/main`**. Multiple merged
fixes are therefore NOT active on the live fleet tooling until this branch syncs.

## Why it matters

The husky pre-commit in every repo calls `../bridge-os/platform/scripts/ecosystem/atomic-settlement-gate.mjs`
from bridge-os's checked-out branch — not `main`. So PRs merged to `main` don't take effect until
bridge-os's working checkout advances.

## Merged to `main` but NOT live (waiting on this sync)

| PR     | Fix                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------- |
| #42    | commit gate: exempt single-file commits from the 600-line budget (unblocks atomic large files)                       |
| #43    | rollout distributes `.cursor/rules` + `.claude/skills` as **copies, not symlinks** (no-symlinks preference)          |
| #17–21 | folder-hygiene reconciliation: canonical doc sets, union resolution, canon-authoritative rules, closed-spec deferral |

## Requested (bridge-os)

1. Merge/rebase `main` into `feat/ai-cost-manifest-proof` (or land the feature branch) so the working
   tree carries these fixes. That activates all of them at once on the live tooling.
2. After sync, run `pnpm ecosystem:agent:conduct:check --all --write` + the skills rollout to **convert
   the remaining `.cursor/rules` + `.claude/skills` symlinks → copies fleet-wide** (the producers now copy;
   `--write` converts existing). The single-file gate exemption (#42) lets the large rule files commit.

## fabric-os position

- All producer + tooling fixes are merged to `main` and verified. `blocksIR: false`.
- The symlink de-debt + the last hygiene holdout (bridge-os working tree) resolve automatically once this sync lands.
