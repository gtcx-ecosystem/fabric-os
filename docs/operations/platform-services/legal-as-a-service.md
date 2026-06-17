---
title: 'Legal-as-a-Service (LEGALaaS)'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
protocol: P45-LEGAL-AS-A-SERVICE
initiative: INIT-GTCX-SERVICE-FABRIC
opsLane: LegalOps
---

# Legal-as-a-Service — GTCX Service Fabric

> **Canonical runbook:** [legalops-as-a-service.md](../legalops-as-a-service.md) — fabric-os owns LegalOps lane (2026-06-17).

**Normative:** `canon-os/docs/governance/protocols/44-fabric-consumption/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/service-fabric.json`  
**Friction SoR:** `pm/legal-friction-register.json`  
**Sovereign crosswalk:** `pm/sovereign-approval-register.json`  
**Fleet protocol:** `bridge-os/pm/spec/ecosystem-legal-program-protocol.json`

## Obligation

Class **S** legal gates (pen-test SOW, SOC 2 MSA, sovereign sign-off) live in the **fabric friction register** with sovereign crosswalk witnesses — product repos hold **manifest links only**. `blocksIR: false` by default; **Approval needed** does not freeze engineering.

## Harness depth (P45 — parity with SECAS)

| Gate            | Command                                    | Witness                                                |
| --------------- | ------------------------------------------ | ------------------------------------------------------ |
| Fabric friction | `pnpm legal:friction:check:write`          | `audit/evidence/legal-friction-check-latest.json`      |
| Fleet program   | `pnpm ecosystem:legal-program:check:write` | `bridge-os/pm/ci/ecosystem-legal-program-latest.json`  |
| Parallel lanes  | `pnpm secas:parallel-lane:check:write`     | `audit/evidence/secas-parallel-lane-check-latest.json` |

Register items carry `sovereignId`, `witness`, `acceptance`, `executionStatus`, and `infraAction` — same depth pattern as `pm/security-friction-register.json`.

## Product interface

1. `ops/legal/manifest.json` → `fabricRegister` href to this repo
2. Status Update **Parallel sovereign gates** pulls register item status — never duplicate legal narrative in product `pm/`
3. Class S items: crosswalk in `pm/sovereign-approval-register.json`

## Operator entry

```bash
pnpm agent:next-work
pnpm legal:friction:check:write
cat pm/legal-friction-register.json
cat ops/legal/manifest.json
pnpm --dir ../bridge-os ecosystem:legal-program:check:write
```

## Register items (2026-06-15)

| ID                | Class | Status | Note                                           |
| ----------------- | ----- | ------ | ---------------------------------------------- |
| LEGAL-EXT-INF-002 | S     | closed | Pen-test SOW approved — vendor window parallel |
| LEGAL-SOC2-01     | S     | closed | Auditor MSA approved — Type I opinion parallel |
| LEGAL-PARALLEL-01 | R     | closed | Legal gates forbidden in product P22           |
| LEGAL-PROGRAM-01  | R     | closed | Register + harness depth sealed                |
