---
title: 'Intake ack — centralized security/legal P0-6 execution gap'
status: current
date: 2026-06-15
owner: fabric-os
tier: critical
tags: [[intake, secas, legal, parallel-lane, p0]]
review_cycle: on-change
document_type: runbook
role: platform-architect
---

# Intake ack — XR-FABRIC-SEC-LEGAL-P0-06

> **Priority:** P0 · **Pillar:** 6 — Centralized security/legal program  
> **Owner:** fabric-os (SECAS) · **Witness:** bridge-os (fleet checks)

## Evidence at intake

| Check                                       | Status                                                     |
| ------------------------------------------- | ---------------------------------------------------------- |
| `ecosystem:legal-program:check`             | PASS                                                       |
| `ecosystem:assurance:milestone-block:check` | PASS — MILESTONE-OPEN + FEATURE-DONE hard-block wired      |
| Fleet head                                  | fabric-os / `SECAS-S2-01` (pen-test window 2026-06-17..21) |

## What works

- Single SECAS queue in fabric-os; bridge does not own pen-test SOW triage.
- Vendor assurance routing spec (`vendor-assurance-status-update-routing.json`) — blocksIR:false.

## Gap (intake scope)

1. **Ingest automation** — proactive per-product security analysis was witness/calendar only; needed live-derived fleet witness + post-ingest milestone unblock chain.
2. **Parallel-lane messaging** — legal/security surfaces correctly in fleet clarity as assurance milestones, but product teams experience "development stopped" unless parallel-lane messaging is machine-enforced.

## Implementation (SECAS-S2-02)

| Artifact                  | Path                                                                   |
| ------------------------- | ---------------------------------------------------------------------- |
| Ingest automation witness | `platform/scripts/secas-ingest-automation-witness.mjs`                 |
| Parallel-lane harness     | `platform/scripts/secas-parallel-lane-check.mjs`                       |
| Fleet witness copy        | `bridge-os/pm/ci/secas-ingest-automation-latest.json`                  |
| Report ingest chain       | `secas-pentest-report-ingest.mjs` → remediation + automation witnesses |

## Acceptance

```bash
pnpm secas:ingest:automation:check:write
pnpm secas:parallel-lane:check:write
pnpm --dir ../bridge-os ecosystem:secas-ingest-automation:check:write
```

## Parallel gates (unchanged)

Vendor report delivery remains **Class S** post-window. Engineering lanes continue — `blocksIR: false`.
