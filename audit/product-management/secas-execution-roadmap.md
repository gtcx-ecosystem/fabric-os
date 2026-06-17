---
title: Execution roadmap — SecOps
status: current
date: 2026-06-17
last_reconciled: 2026-06-17T13:01:55.750Z
owner: fabric-os
program: INIT-GTCX-INFRA-SECAS
generated: true
generated_by: platform/scripts/generate-secas-execution-roadmap.mjs
sources:
  - pm/secas-roadmap.json
  - pm/security-friction-register.json
  - pm/secas-stories.json
  - pm/sovereign-approval-register.json
  - audit/evidence/secas-friction-check-latest.json
  - audit/evidence/secas-approval-check-latest.json
---

# fabric-os SecOps execution roadmap

> **Generated file.** Edit `pm/secas-stories.json`, `pm/security-friction-register.json`, or
> `pm/secas-roadmap.json`, then run `pnpm generate:secas-roadmap`.

**Ops lane:** SecOps · **Functional product:** SECaaS — parallel to DevOps/InfraOps (DaaS), not product PM.

## Active Phase: PROGRAM-SPRINTS-COMPLETE — all SECaaS program sprints sealed

**Status:** `complete`

_All SECaaS program sprints (S1–S5) sealed. Vendor calendar gates run in parallel — see below._

## Post-launch external (NOT internal roadmap)

> Vendor/auditor calendar artifacts — **excluded from P22 and agent work.**
> SoR: [`ops/coordination/post-launch-external-gates.json`](../../ops/coordination/post-launch-external-gates.json)

| ID              | Actor                            | Window / earliest | blocksIR |
| --------------- | -------------------------------- | ----------------- | -------- |
| BG-10-10        | External pen-test vendor         | 2026-06-17..21    | false    |
| BG-10-10-REPORT | External pen-test vendor         | post 2026-06-21   | false    |
| BG-10-11        | External auditor (SOC 2 opinion) | parallel track    | false    |

## Internal human (GTCX — NOT agent P22)

> SoR: [`ops/coordination/internal-human-gates.json`](../../ops/coordination/internal-human-gates.json)

_Open: EXT-INF-014, EXT-INF-015, H-03 · Closed: EXT-INF-002, EXT-INF-013, BL-SOC2-01 engagement_

## Future Phases

| Sprint   | Goal                                                                        | Status   | Owner     | Stories / Friction                                                        |
| -------- | --------------------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------- |
| SECAS-S1 | Sovereign register + security friction SoR                                  | complete | fabric-os |                                                                           |
| SECAS-S2 | Pen-test ingest scaffolding (internal prep complete)                        | complete | fabric-os | `SEC-PENTEST-01`                                                          |
| SECAS-S3 | Fleet IRSA + WAF hardening cards                                            | complete | fabric-os |                                                                           |
| SECAS-S4 | Security engineering operating program (CSIRT, supply chain, vuln cadence)  | complete | fabric-os | `SEC-CSIRT-01`, `SEC-SUPPLY-01`, `SEC-VULN-01`, `SEC-PTREM-01`            |
| SECAS-S5 | Continuous assurance (purple team, AI red-team, PQC, product threat models) | complete | fabric-os | `SECAS-S5-01`, `SECAS-S5-02`, `SECAS-S5-03`, `SECAS-S5-04`, `SECAS-S5-05` |

## Issue Reconciliation

| Issue                        | Source                               | Roadmap Mapping | Status |
| ---------------------------- | ------------------------------------ | --------------- | ------ |
| `SEC-PENTEST-01`             | `pm/security-friction-register.json` | SECAS-S2-01     | done   |
| `SEC-WAF-01`                 | `pm/security-friction-register.json` | —               | done   |
| `SEC-IRSA-01`                | `pm/security-friction-register.json` | —               | done   |
| `SEC-CSIRT-01`               | `pm/security-friction-register.json` | SECAS-S4-01     | done   |
| `SEC-SUPPLY-01`              | `pm/security-friction-register.json` | SECAS-S4-02     | done   |
| `SEC-VULN-01`                | `pm/security-friction-register.json` | SECAS-S4-03     | done   |
| `SEC-PTREM-01`               | `pm/security-friction-register.json` | SECAS-S4-04     | done   |
| P42 hub protocol publication | `pm/_tasks`                          | gtcx-docs       | done   |

## Unblock Order

_No open security friction items — program clear for current sprint._
