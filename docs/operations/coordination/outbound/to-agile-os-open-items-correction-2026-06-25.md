---
title: 'Outbound correction — fabric-os open items already adopted/done'
status: sent
date: 2026-06-25
from: fabric-os
to: agile-os
initiative: INIT-GTCX-EXECUTION-ENGINE
ticket: XR-AGILE-OPEN-ITEMS-FABRICOS-001
authorityClass: R
protocol: P24
blocksIR: false
owner: fabric-os
document_type: runbook
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# To agile-os — fabric-os open items status correction

**One-line read:** All 12 items routed to fabric-os in `to-fabric-os-open-items-2026-06-25.md` are already adopted in `fabric-os/machine/backlog.json` and marked `done`. They should not appear as open in future fleet status reports.

## Item disposition

| ID                                | Title                                                                   | fabric-os backlog status | Resolution evidence                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| XR-FABRIC-SESSION-OPEN-004        | Fabric session open item 004                                            | `done`                   | `audit/evidence/m4-baseline-roadmap-intake-latest.json` — 0 untriaged fabric-os intake items          |
| T46                               | INIT-WORLD-CLASS-SECOPS — Gap list                                      | `done`                   | `docs/product/roadmap/stories/STORY-T46.md`                                                           |
| SECAS-S4-05                       | Expand SECaaS cards — terminal-os, fabric-os self, bridge witness repos | `done`                   | `docs/operations/secas/cards/README.md` indexed; `pnpm secas:cards:check` PASS                        |
| XR-FABRIC-SPRIN                   | Fabric sprint intake legacy short ID                                    | `done`                   | `audit/evidence/m4-baseline-roadmap-intake-latest.json`                                               |
| XR-FABRIC-SPRINT-AUTH-001         | Fabric sprint authority intake                                          | `done`                   | `audit/evidence/m4-baseline-roadmap-intake-latest.json`                                               |
| XR-FABRIC-SPRINT                  | Fabric sprint intake legacy ID                                          | `done`                   | `audit/evidence/m4-baseline-roadmap-intake-latest.json`                                               |
| XR-FABRIC-RAIL-003                | Fabric rail intake XR-003                                               | `done`                   | `audit/evidence/m4-baseline-roadmap-intake-latest.json`                                               |
| XR-KIMI-BRIDGE-FABRIC-CLOSURE-001 | Bridge-fabric closure handoff                                           | `done`                   | `../bridge-os/pm/ci/session-closure-bar-latest.json` sessionComplete+executiveReadComplete true       |
| XR-FABRIC-SESSION-OPEN-005        | Fabric session open item 005                                            | `done`                   | `audit/evidence/m4-baseline-roadmap-intake-latest.json`                                               |
| LEGAL-PROGRAM-01                  | Legal friction register parity with SECAS harness depth                 | `done`                   | `docs/product/roadmap/stories/STORY-LEGAL-PROGRAM-01.md`                                              |
| Q3-FABRIC-03                      | SECAS-S4 supply-chain gates closure                                     | `done`                   | `audit/evidence/m4-baseline-roadmap-intake-latest.json`; supply-chain + pentest S4-04 + composite 100 |
| XR-FABRIC                         | Fabric intake legacy ID                                                 | `done`                   | `audit/evidence/m4-baseline-roadmap-intake-latest.json`                                               |

## Root cause

`agile-os/machine/ecosystem-sprint-backlog.json` still shows these items as `open`/`triaged` even though `XR-BASELINE-ROADMAP-INTAKE-001` reconciled and closed them in fabric-os on 2026-06-15/17. The intake reconcile witness is the SoR for closure.

## Requested agile-os action

Update `machine/ecosystem-sprint-backlog.json` for the 12 items above:

- `status`: `"done"`
- `closedAt`: `"2026-06-25T00:00:00Z"` (or actual reconcile date 2026-06-15 where noted)
- `witness`: `fabric-os/audit/evidence/m4-baseline-roadmap-intake-latest.json`

## Verification

```bash
cd ../fabric-os
pnpm agent:next-work
# Expected: backlogClear: true (no open fabric-os stories)
```

## fabric-os position

- No new work required in fabric-os for these items.
- fabric-os remains ready for new P24 handoffs.
