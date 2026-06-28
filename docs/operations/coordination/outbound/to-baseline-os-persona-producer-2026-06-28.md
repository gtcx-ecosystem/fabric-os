---
title: 'Outbound — own + wire the persona producer (persona:read-witness) in baseline-os'
status: sent
date: 2026-06-28
from: fabric-os
to: [baseline-os]
ticket: XR-PERSONA-PRODUCER-001
parent: XR-AGENT-CAPABILITY-OWNERSHIP-001
authorityClass: A
protocol: P24
blocksIR: false
owner: baseline-os
---

# To baseline-os — own the persona producer + wire it fleet-wide

**One-line read:** the persona producer (`persona:read-witness`) lives in **bridge-os** but is
**unwired in several repos**, so `GATE-PERSONA-READ` blocks ordinary commits there. Personas are
AI-OS content → the producer belongs in **baseline-os**, and it must be wired fleet-wide so the
gate stops false-blocking. Operational sub-ticket of `XR-AGENT-CAPABILITY-OWNERSHIP-001`.

## Current state

- Producer exists: `bridge-os/platform/scripts/agent/persona-read-witness.mjs`
  (writes `.baseline/session/persona-read-latest.json`).
- The gate (`bridge-os/.../atomic-settlement-gate.mjs` → `GATE-PERSONA-READ`) requires that
  witness fresh (<24h) when a story-persona bind is active.
- **Unwired** (no `persona:read-witness` script) in: **ledger-ui, compliance-os, terra-os,
  exploration-os** — the gate's suggested fix command (`pnpm persona:read-witness --write`) does
  not exist there, so commits are blocked with no self-service remedy.

## Impact (observed)

fabric-os repeatedly hit `GATE-PERSONA-READ` while landing routine doc/witness commits in those
4 repos; had to run the bridge-os producer by absolute path to unblock. Any agent in those repos
with an active persona bind is blocked the same way.

## Requested (baseline-os)

1. **Own** `persona:read-witness` (move from bridge-os, per the capability-ownership move).
2. **Wire it fleet-wide** — every repo gets a runnable `persona:read-witness` script so the gate's
   own remediation command works (no absolute-path workarounds).
3. Coordinate with bridge-os on the gate (`GATE-PERSONA-READ`) so the producer + gate stay paired
   after the move, and sequence with `XR-BRIDGE-FEAT-SYNC-001` (feat→main) for live effect.

## fabric-os position

- `blocksIR: false` — not fabric-os's to own; surfaced because it's an active commit blocker.
- Until wired, fabric-os will keep using the bridge-os producer by path when a commit is blocked
  (never `--no-verify`, never a fabricated witness).
