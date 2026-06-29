---
title: 'Inbound ack — Protocol 62 shared-root concurrency drift check'
status: implemented
date: 2026-06-29
from: baseline-os
to: fabric-os
initiative: INIT-HUB-SCOPE-GUARD
ticket: XR-CANON-AGENT-WORKTREE-062
protocol: P24
---

# Inbound ack — Protocol 62 phase 4

| Field                | Value                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| **Inbound source**   | `baseline-os/workstream/coordination/outbound/to-canon-os-protocol-62-worktree-isolation-2026-06-29.md` |
| **Protocol**         | **P62 — Agent worktree isolation (AGENT-WORKTREE)**                                                     |
| **Status**           | **implemented**                                                                                         |
| **Fabric-os commit** | `67b1ec75`                                                                                              |
| **Branch**           | `feat/ai-cost-check`                                                                                    |

## fabric-os actions taken

- Added `platform/scripts/shared-root-concurrency-check.mjs`.
- Discovers ecosystem repos and lists linked worktrees per git common directory.
- Flags drift when:
  - the shared main checkout has uncommitted changes while worktrees exist; or
  - more than one worktree for the same repo has uncommitted changes.
- Writes deterministic witness to `audit/evidence/shared-root-concurrency-latest.json`.
- Added package.json scripts:
  - `pnpm check:shared-root-concurrency`
  - `pnpm check:shared-root-concurrency:write`
- Added `platform/scripts/tests/shared-root-concurrency-check.test.mjs`.

## Verification

```bash
pnpm check:shared-root-concurrency
pnpm check:shared-root-concurrency:write
pnpm test -- platform/scripts/tests/shared-root-concurrency-check.test.mjs
```

## Current fleet state

The 2026-06-29 run reports 17 repos with shared-root concurrency drift. These
reflect pre-existing shared-checkout usage before P62 enforcement and should be
remediated by moving active work into per-agent worktrees and keeping the main
checkout read-only.
