---
title: 'Fabric OS — Strategic execution roadmap'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['protocol', 'documentation']
review_cycle: on-change
document_type: protocol
program: INIT-GTCX-INFRA-DAAS / INIT-GTCX-INFRA-SECAS
activeMilestone: FLEET-SECOPS-COMPLIANCEOPS-CLEARANCE
cpoSoR: agile-os/pm/ecosystem-sprint-backlog.json
---

# Fabric OS — Strategic execution roadmap

> **Tactical CPO source of truth:** `agile-os` is the fleet execution engine and tactical CPO; this roadmap is the fabric-os local reconciliation of `audit/product-management/execution-roadmap.md` (DaaS) and `audit/product-management/secas-execution-roadmap.md` (SECaaS).
>
> **Canonical execution plans (generated):**
>
> - DaaS/InfraOps: [`audit/product-management/execution-roadmap.md`](../audit/product-management/execution-roadmap.md)
> - SecOps: [`audit/product-management/secas-execution-roadmap.md`](../audit/product-management/secas-execution-roadmap.md)
> - Active milestone: [`pm/spec/product-goals.json`](../pm/spec/product-goals.json) → `FLEET-SECOPS-COMPLIANCEOPS-CLEARANCE`

## Current state

| Program                           | Status                         | Active item                            | Blocker / next action                                                  |
| --------------------------------- | ------------------------------ | -------------------------------------- | ---------------------------------------------------------------------- |
| DaaS (INIT-GTCX-INFRA-DAAS)       | **done** — S1–S3 sealed        | —                                      | None                                                                   |
| SECAS (INIT-GTCX-INFRA-SECAS)     | **active** — S4-04 in progress | SECAS-S4-04 pen-test remediation track | `BG-10-10-REPORT` vendor report (parallel external, `blocksIR: false`) |
| Fleet assurance                   | **active**                     | `FLEET-SECOPS-COMPLIANCEOPS-CLEARANCE` | Hold composite ≥85 + pen-test intake readiness                         |
| AI/ML ops lane (feature/ai-mlops) | **planned**                    | MLOps substrate alignment              | Awaiting bridge-os MLOps lane charter handoff                          |

## Done (sealed)

### DevOps-as-a-Service (DAAS)

| Sprint  | Story           | Outcome                                                 | Evidence                                                   |
| ------- | --------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| DAAS-S1 | DAAS-S1-01 / 02 | DaaS friction register + canonical fleet-health witness | `pnpm daas:friction:check:write`, `pnpm daas:fleet:health` |
| DAAS-S1 | DAAS-S1-03 / 04 | AGX staging health + XR-MKT-011 authority routes sealed | Cross-repo health PASS, markets authority trace 7/7        |
| DAAS-S1 | DAAS-S1-05      | `validate-all` aligned to P35 paths (55/55)             | `node platform/tools/scripts/validate-all.mjs`             |
| DAAS-S2 | DAAS-S2-01 / 02 | Per-repo DaaS cards + ingress action matrix             | `pnpm daas:cards:check:write`                              |
| DAAS-S3 | DAAS-S3-01      | Compliance-os GHCR imagePullSecrets applied             | `pnpm --dir ../compliance-os w2:staging-prereq-check`      |
| DAAS-S3 | DAAS-S3-02      | Intelligence staging image with `ENABLE_COST_ROUTER`    | `pnpm daas:fleet:health`, cost-router witness              |

### Security-as-a-Service (SECAS)

| Sprint   | Story                      | Outcome                                                                                           | Evidence                                                                                       |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| SECAS-S1 | SECAS-S1-01 / 02           | Sovereign + friction registers; P42 hub protocol published                                        | `pnpm secas:friction:check:write`, bridge ecosystem SECAS check 8/8                            |
| SECAS-S2 | SECAS-S2-01 / 02           | Pen-test ingest scaffolding + automation witness                                                  | Window ready, ingest dry-run PASS                                                              |
| SECAS-S3 | SECAS-S3-01 / 02           | IRSA review + SECaaS cards for product repos                                                      | SECAS cards check PASS                                                                         |
| SECAS-S4 | SECAS-S4-01 / 02 / 03 / 05 | CSIRT model, supply-chain gates, vuln cadence, cards expansion                                    | `secas:csirt`, `secas:supply-chain`, `secas:vuln-cadence`, `secas:cards` all PASS              |
| SECAS-S5 | SECAS-S5-01..05            | Continuous assurance — risk/threat registers, product threat models, AI red-team, PQC, bug bounty | `fleet:risk:check`, `fleet:threat:check`, purple-team / product-threat / pqc / bounty-ops PASS |

### Fleet taxonomy & lane alignment

| Initiative                       | Status | Evidence                                                                  |
| -------------------------------- | ------ | ------------------------------------------------------------------------- |
| INIT-GTCX-TRADE-ECOSYSTEM-LANES  | done   | `audit/evidence/fabric-lanes-check-latest.json`                           |
| INIT-FABRIC-LANE-DEPLOY-MATRIX   | done   | `docs/operations/coordination/infra-per-repo-action-matrix-2026-06-05.md` |
| INIT-FABRIC-README-SOR-REconcile | done   | README + AGENTS.md reconciled                                             |

## Active

### SECAS-S4-04 — Pen-test findings remediation track + re-test witness

- **Priority:** P0
- **Owner:** fabric-os
- **Status:** `in_progress` (internal Class R scaffold sealed; execution awaits vendor report)
- **Acceptance:**
  - [x] Remediation register + closure scaffold at canonical paths
  - [x] Owner mapping matrix for fabric + product repos
  - [ ] Vendor report findings mapped to owners
  - [ ] Critical/high findings closed or accepted-risk documented (Class S)
- **Blocker:** `BG-10-10-REPORT` external pen-test vendor report — earliest ingest **post 2026-06-21**
- **Witness:** `audit/evidence/secas-s4-04-internal-closure-2026-06-15.json`

### Fleet SecOps + ComplianceOps clearance

- **Milestone:** `FLEET-SECOPS-COMPLIANCEOPS-CLEARANCE`
- **Target date:** 2026-06-15
- **Outcome:** SecOps internal Class R sealed; ComplianceOps harness PASS; vendor gates remain parallel only
- **Checks:**
  - `audit/evidence/fleet-secops-complianceops-clearance-2026-06-15.json` — PASS
  - `../bridge-os/pm/ci/complianceops-fleet-latest.json` — PASS
  - Composite ≥85 tracked in `audit/evidence/five-pillar-latest.json`

## Planned

| Item                                        | Target                     | Owner                   | Notes                                                                        |
| ------------------------------------------- | -------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| BG-10-10-REPORT ingest + findings mapping   | Post 2026-06-21            | fabric-os               | Class A execution after vendor report delivery                               |
| Critical/high pen-test remediation          | Post report ingest         | fabric-os + owner repos | Class S acceptance-risk where applicable                                     |
| SOC 2 Type II auditor opinion (BL-SOC2-01)  | Parallel calendar          | Human/Security          | `blocksIR: false`; recorded in sovereign register                            |
| AI/ML ops lane substrate (feature/ai-mlops) | Sprint after MLOps charter | fabric-os               | Align MLOps bridge contract, cost-router prod rollout, model-serving ingress |
| Five-pillar fleet 100/100 sustain           | Ongoing                    | fabric-os               | `node platform/tools/scripts/validate-all.mjs` + `pnpm ops:check`            |

## Cross-repo references

- **Fleet CPO / execution engine:** `agile-os/pm/ecosystem-sprint-backlog.json`
- **Program office:** `bridge-os/pm/spec/internal-secops-complianceops-clearance.json`
- **Post-launch external gates:** `ops/coordination/post-launch-external-gates.json`
- **Sovereign approvals:** `pm/sovereign-approval-register.json`
- **Security friction:** `pm/security-friction-register.json`

## How to update this file

1. Edit canonical generated sources: `pm/daas-stories.json`, `pm/secas-stories.json`, `pm/friction-register.json`, `pm/security-friction-register.json`.
2. Run `pnpm generate:roadmap` and `pnpm generate:secas:roadmap` to refresh `audit/product-management/` execution plans.
3. Refresh this strategic synthesis when milestone or active story changes.
