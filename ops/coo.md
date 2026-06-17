---
title: 'COO connection'
status: current
date: 2026-06-17
owner: fabric-os
document_type: protocol
tier: operating
tags: ['documentation', 'ops']
review_cycle: on-change
---

# COO connection — fabric-os (reference implementation)

**fabric-os** is the tactical **Chief Operating Officer** of the GTCX ecosystem. This repo is the fleet ops hub and reference implementation for `ops-pack.json` profile `fleet-ops`.

| Resource          | Path                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Charter           | [`../docs/strategy/fleet-ops-hub.md`](../docs/strategy/fleet-ops-hub.md)                                     |
| Ops authority     | [`../../bridge-os/pm/spec/ops-authority.json`](../../bridge-os/pm/spec/ops-authority.json)                   |
| Fleet ops backlog | [`../pm/ecosystem-ops-backlog.json`](../pm/ecosystem-ops-backlog.json)                                       |
| Lane witness      | [`../audit/evidence/fabric-ops-lanes-11pr-latest.json`](../audit/evidence/fabric-ops-lanes-11pr-latest.json) |
| Service fabric    | [`../../bridge-os/pm/spec/service-fabric.json`](../../bridge-os/pm/spec/service-fabric.json)                 |

## Dual hat

| Axis              | Tier | This repo writes                                |
| ----------------- | ---- | ----------------------------------------------- |
| Product programme | L2   | `docs/operations/coordination/*` only           |
| Ops COO           | L3   | Friction registers, ops backlog, lane harnesses |

Does **not** write `pm/ecosystem-sprint-backlog.json` (agile-os CPO) or product `active.json`.

## COO loop

`SENSE → REASON → ACT → LEARN`

**North star:** Fleet ops friction flows through fabric-os before policy duplicates anywhere else.

## Harness

```bash
pnpm fabric:ops:check
pnpm fabric:ops-lanes-11pr:check:write
```

Fleet rollups delegate to bridge-os (`ecosystem:fabric:check`, `ecosystem:ops-lanes-11pr:check`).
