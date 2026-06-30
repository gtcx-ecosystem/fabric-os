---
title: 'GTCX Cross-Repo Program Backlog (aggregate index)'
status: current
date: 2026-06-02
owner: fabric-os
tier: operating
tags: [['documentation', 'sprints', 'coordination']]
review_cycle: on-change
document_type: protocol
role: agile-lead
---

# GTCX Cross-Repo Program Backlog

> **Aggregation only — not a canonical inbox.**  
> **fabric-os aggregates** program priority and navigation. **baseline-os stores** cross-repo blockers, inbound tickets, and coordination indexes. **Each repo owns** its execution roadmap and deliverables.

## Protocol 22 scope

| Register                         | Path                                                                                     | Agent auto-select? |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ------------------ |
| In-repo execution (this repo)    | [`01-01-docs/strategy/execution-roadmap.md`](../strategy/execution-roadmap.md)           | **Yes**            |
| This file (program lens + links) | `01-01-docs/sprints/backlog.md`                                                          | **No**             |
| V1 wave tracker                  | [`01-01-docs/v1-shipping/execution-tracker.json`](../v1-shipping/execution-tracker.json) | **No**             |

Agents **do not** implement cross-repo deliverables from this file. Escalate blockers to baseline-os inbound; implement work in the **owning repo** via that repo’s Protocol 22 roadmap.

See [`01-01-01-docs/04-ops/agent-work-selection.md`](../operations/agent-work-selection.md).

---

## Where truth lives

| Concern                      | Canonical owner | Path                                                                                                     |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| Active cross-repo blockers   | **baseline-os** | `baseline-os/workstream/index/blockers.md`                                                               |
| Inbound tickets (cross-repo) | **baseline-os** | `baseline-os/workstream/index/inbound.md`                                                                |
| Workstream artifact index    | **baseline-os** | `baseline-os/workstream/index/UNIFIED.md`                                                                |
| Coordination reports         | **baseline-os** | `baseline-os/workstream/coordination/coordination-report-*.md`                                           |
| Repo execution stories       | **each repo**   | See [Repo roadmap index](#repo-roadmap-index)                                                            |
| V1 program waves / UAT       | **fabric-os**   | [`01-01-docs/v1-shipping/ecosystem-v1-ssot.md`](../v1-shipping/ecosystem-v1-ssot.md)                     |
| Dependency graph metadata    | **fabric-os**   | [`03-platform/03-platform/src/ecosystem-graph.ts`](../../03-platform/03-platform/src/ecosystem-graph.ts) |

**Refresh blockers:** `pnpm ecosystem:coordination --dispatch` (from baseline-os).  
**Do not** copy blocker tables into this file — link and summarize themes only.

---

## Active blocker snapshot

P0/P1 items are maintained in baseline-os. Query there before planning.

| Priority         | Entry point                                              |
| ---------------- | -------------------------------------------------------- |
| P0 critical path | `baseline-os/workstream/index/blockers.md` § P0 Blockers |
| P1               | `baseline-os/workstream/index/blockers.md` § P1 Blockers |
| Open inbound     | `baseline-os/workstream/index/inbound.md`                |

**Examples (2026-06-01):** HSM authority keys / sovereign ceremony -> `baseline-os/workstream/coordination/inbound/from-gtcx-protocols-2026-06-01.md`; intelligence bridge sign-off -> `baseline-os/workstream/index/inbound.md`.

---

## Program priority lens (MoSCoW)

Charter-aligned **themes** for leadership ordering. Deliverables and acceptance criteria live in **repo roadmaps** and **baseline-os blockers** — not here.

### Must Have — Phase 1 (Q2 2026)

ZWCMP Charter tech commitments. Phase 2 does not start until these themes exit blocked state.

| Theme                                         | Primary repo(s)                  | Canonical roadmap                                                   | Blocker / inbound index                                                      |
| --------------------------------------------- | -------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Protocol persistence (GCI, TradePass, GeoTag) | `gtcx-protocols`                 | `gtcx-protocols/01-01-01-docs/05-audit/agile/roadmap.md`            | `baseline-os/workstream/index/blockers.md`                                   |
| ANISA real underwriting + GCI wire            | `bridge-os` intelligence bridge  | `bridge-os/docs/operations/product-management/execution-roadmap.md` | `baseline-os/workstream/index/inbound.md`                                    |
| Field mobile (TradePass, GeoTag, offline)     | `gtcx-mobile`                    | `gtcx-mobile/01-01-01-docs/05-audit/execution-roadmap.md`           | `baseline-os/workstream/coordination/inbound/from-gtcx-mobile-2026-05-26.md` |
| AML/KYC + ESG pipeline                        | `compliance-os`                  | `compliance-os/01-01-docs/roadmap/master-roadmap.md`                | `baseline-os/workstream/index/blockers.md`                                   |
| Zimbabwe deployment fabric                    | `fabric-os`                      | `fabric-os/audit/product-management/execution-roadmap.md`           | `baseline-os/workstream/index/blockers.md` § P0 #2                           |
| Price oracle / verification premium           | `gtcx-markets`, `gtcx-platforms` | `gtcx-markets/01-01-docs/strategy/execution-roadmap.md`             | `baseline-os/workstream/index/UNIFIED.md` (Roadmap)                          |

### Should Have — Phase 2 (Q3 2026)

Commercial activation, DFI facility, SA buyer layer.

| Theme                                 | Primary repo(s)  | Canonical roadmap                                            | Notes                                                                 |
| ------------------------------------- | ---------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| AGX / CRX / SGX first implementations | `gtcx-platforms` | `gtcx-platforms/01-01-01-docs/05-audit/execution-roadmap.md` | V1: [`execution-tracker.json`](../v1-shipping/execution-tracker.json) |
| Platform SPV + event bus              | `fabric-os`      | `fabric-os/audit/product-management/execution-roadmap.md`    | Cross-repo pub/sub                                                    |
| PvP settlement consumer               | `gtcx-protocols` | `gtcx-protocols/01-01-01-docs/05-audit/agile/roadmap.md`     | Depends persistence Phase 1                                           |
| Terminal / Fifty-Four real data       | `terminal-os`    | `terminal-os/01-01-docs/strategy/execution-roadmap.md`       | OpenAPI contract with backends                                        |

### Could Have — Phase 3 (Q4 2026)

Scale, multi-jurisdiction, hardware attestation, index publication.

| Theme                               | Primary repo(s) | Canonical roadmap                                      |
| ----------------------------------- | --------------- | ------------------------------------------------------ |
| Multi-jurisdiction mobile + offline | `gtcx-mobile`   | `gtcx-mobile/01-01-docs/roadmap/README.md`             |
| Hardware attestation pipeline       | `gtcx-hardware` | `gtcx-hardware/01-01-docs/roadmap/README.md`           |
| Ledger / design system stable v1    | `ledger-ui`     | `ledger-ui/01-01-docs/strategy/execution-roadmap.md`   |
| Domain configs (SA, Ghana)          | `terra-os`      | `terra-os/01-01-01-docs/05-audit/execution-roadmap.md` |

### Won't Have (2026)

Explicitly deprioritized — detail in archived charter deliverable list: [`archive/backlog-charter-deliverables-2026-03-09.md`](archive/backlog-charter-deliverables-2026-03-09.md).

---

## Repo roadmap index

Paths are **relative to ecosystem root** (`gtcx-ecosystem/`). Prefer the repo’s Protocol 22 register when present; otherwise use the repo’s published planning doc. Full discovery: `baseline-os/workstream/index/UNIFIED.md` § Roadmap.

| Repo              | Protocol 22 register                                                | Planning / roadmap (fallback)                                     |
| ----------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `baseline-os`     | `baseline-os/01-01-01-docs/05-audit/execution-roadmap.md`           | `baseline-os/01-01-docs/strategy/roadmap.md`                      |
| `gtcx-core`       | `gtcx-core/01-01-01-docs/05-audit/execution-roadmap.md`             | `gtcx-core/01-01-01-docs/05-audit/agile/sprints/current.md`       |
| `gtcx-protocols`  | `gtcx-protocols/01-01-01-docs/05-audit/execution-roadmap.md`        | `gtcx-protocols/01-01-01-docs/05-audit/agile/roadmap.md`          |
| `fabric-os`       | `fabric-os/audit/product-management/execution-roadmap.md`           | `fabric-os/workstream/sprints/current.md`                         |
| `bridge-os`       | `bridge-os/docs/operations/product-management/execution-roadmap.md` | `bridge-os/machine/execution-roadmap.md`                          |
| `gtcx-platforms`  | `gtcx-platforms/01-01-01-docs/05-audit/execution-roadmap.md`        | `gtcx-platforms/01-01-docs/roadmap/roadmap.md`                    |
| `gtcx-agentic`    | `bridge-os/01-01-01-docs/05-audit/execution-roadmap.md`             | `bridge-os/01-01-01-docs/05-audit/agile/sprints/current.md`       |
| `fabric-os`       | `fabric-os/01-01-docs/strategy/execution-roadmap.md`                | —                                                                 |
| `compliance-os`   | `compliance-os/01-01-01-docs/05-audit/execution-roadmap.md`         | `compliance-os/01-01-docs/roadmap/master-roadmap.md`              |
| `sensei-os`       | `sensei-os/01-01-01-docs/05-audit/execution-roadmap.md`             | `sensei-os/01-01-docs/roadmap/roadmap-index.md`                   |
| `terminal-os`     | `terminal-os/01-01-docs/strategy/execution-roadmap.md`              | `terminal-os/01-01-docs/roadmap/README.md`                        |
| `terra-os`        | `terra-os/01-01-01-docs/05-audit/execution-roadmap.md`              | `terra-os/01-01-docs/roadmap/ROADMAP.md`                          |
| `ledger-ui`       | `ledger-ui/01-01-docs/strategy/execution-roadmap.md`                | `ledger-ui/01-01-01-docs/05-audit/agile/sprints/current.md`       |
| `gtcx-mobile`     | `gtcx-mobile/01-01-01-docs/05-audit/execution-roadmap.md`           | `gtcx-mobile/01-01-docs/roadmap/README.md`                        |
| `nyota-ai`        | —                                                                   | `nyota-ai/01-01-docs/roadmap/uat-plan.md`                         |
| `gtcx-hardware`   | —                                                                   | `gtcx-hardware/01-01-docs/roadmap/README.md`                      |
| `gtcx-docs`       | `gtcx-01-01-docs/01-01-docs/strategy/execution-roadmap.md`          | `gtcx-01-01-docs/01-01-docs/roadmap/ROADMAP-2026-07-13.md`        |
| `gtcx-operations` | —                                                                   | `gtcx-operations/01-01-01-docs/05-audit/agile/sprints/current.md` |
| `exploration-os`  | `exploration-os/01-01-docs/strategy/execution-roadmap.md`           | `exploration-os/01-01-docs/roadmap/roadmap.md`                    |
| `griot-ai`        | —                                                                   | `griot-ai/01-01-docs/roadmap/roadmap-s0-to-s3.md`                 |
| `gtcx-markets`    | `gtcx-markets/01-01-docs/strategy/execution-roadmap.md`             | `gtcx-markets/01-01-01-docs/05-audit/agile/sprints/current.md`    |
| `veritas-ai`      | —                                                                   | `veritas-ai/01-01-docs/roadmap/README.md`                         |

**Legacy names (historical docs):** `3-protocols` -> `gtcx-protocols`; `5-intelligence` -> `bridge-os` intelligence bridge; `7-mobile` -> `gtcx-mobile`; `6-platforms` -> `gtcx-platforms`; `4-infrastructure` -> `fabric-os`; `ai-3-fiftyfour` -> `terminal-os`; `ai-2-ledger` -> `ledger-ui`; `ai-6-terra` -> `terra-os`.

---

## How to add or change priority

1. **New cross-repo blocker** → file inbound in **baseline-os** (`baseline-os/workstream/coordination/inbound/from-{repo}-{date}.md`); index updates via `pnpm ecosystem:workstream:sync`.
2. **Repo deliverable** → edit that **repo’s roadmap**; do not append long task lists here.
3. **Program theme reorder** → edit MoSCoW **theme rows** in this file only; requires explicit operator instruction (see `CLAUDE.md`).
4. **V1 wave status** → [`01-01-docs/v1-shipping/execution-tracker.json`](../v1-shipping/execution-tracker.json) + SSOT.

---

## Related

- [`01-01-docs/v1-shipping/ecosystem-v1-ssot.md`](../v1-shipping/ecosystem-v1-ssot.md) — V1 program SSOT
- [`01-01-docs/strategy/README.md`](../strategy/README.md) — in-repo vs cross-repo registers
- [`01-01-docs/conventions.md`](../conventions.md) — coordination contract (baseline-os hub)
- [`archive/backlog-charter-deliverables-2026-03-09.md`](archive/backlog-charter-deliverables-2026-03-09.md) — superseded detailed charter list
