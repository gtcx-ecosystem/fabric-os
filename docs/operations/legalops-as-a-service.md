---
title: 'LegalOps-as-a-Service (LEGALaaS)'
status: current
date: 2026-06-17
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation', 'legalops']
review_cycle: on-change
document_type: runbook
protocol: P45-LEGAL-AS-A-SERVICE
initiative: INIT-ECOSYSTEM-LEGAL-PROGRAM
opsLane: LegalOps
---

# LegalOps-as-a-Service — fabric-os

**Owner:** fabric-os · **Ops lane:** LegalOps · **Protocol:** P45  
**Machine spec:** `pm/spec/legalops-as-a-service.json`  
**Friction SoR:** `pm/legal-friction-register.json`  
**Sovereign crosswalk:** `pm/sovereign-approval-register.json`  
**Fleet protocol:** `bridge-os/pm/spec/ecosystem-legal-program-protocol.json`  
**Human gates manifest (canon):** `canon-os/ops/coordination/hub-narrative/human-gates.manifest.json`

## Obligation

Class **S** legal gates (pen-test SOW, SOC 2 MSA, DPA, sovereign sign-off) live in the **fabric friction register** with sovereign crosswalk witnesses. Product repos hold **manifest links only**. `blocksIR: false` by default — **Parallel sovereign gates** in Status Update, never product P22.

## Harness

| Gate            | Command                                    | Witness                                                |
| --------------- | ------------------------------------------ | ------------------------------------------------------ |
| LegalOps lane   | `pnpm legalops:check:write`                | `audit/evidence/legalops-check-latest.json`            |
| Fabric friction | `pnpm legal:friction:check:write`          | `audit/evidence/legal-friction-check-latest.json`      |
| Fleet program   | `pnpm ecosystem:legal-program:check:write` | `bridge-os/pm/ci/ecosystem-legal-program-latest.json`  |
| Parallel lanes  | `pnpm secas:parallel-lane:check:write`     | `audit/evidence/secas-parallel-lane-check-latest.json` |

## Product interface

1. `ops/legal/manifest.json` → `fabricRegister` href to this repo
2. Status Update **Parallel sovereign gates** — never duplicate legal narrative in product `pm/`
3. Class S items: crosswalk in `pm/sovereign-approval-register.json`

## Operator entry

```bash
pnpm legalops:check:write
pnpm legal:friction:check:write
pnpm --dir ../bridge-os ecosystem:legal-program:check:write
cat pm/legal-friction-register.json
```
