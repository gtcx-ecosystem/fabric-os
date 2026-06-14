---
title: SECAS-S5 — Continuous assurance program
status: current
date: 2026-06-14
owner: fabric-os
initiative: INIT-GTCX-INFRA-SECAS
protocol: P42-SECURITY-AS-A-SERVICE
opsLane: SecOps
dependsOn: SECAS-S4
---

# SECAS-S5 — Continuous assurance (world-class cyber program)

> **Position:** **SECAS-S4** = standing SecOps engineering (CSIRT, supply chain, vuln cadence). **SECAS-S5** = continuous assurance — internal purple team, bug bounty ops, AI red-team fleet rollup, PQC readiness.

## Sprint goal

Close the gap between **pen-test ceremony** and **world-class continuous program**:

| Track              | Deliverable                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| **Unified risk**   | `bridge-os/pm/spec/fleet-risk-register.json` + `pnpm fleet:risk:check`      |
| **Active threats** | `bridge-os/pm/spec/fleet-threat-register.json` + TI/internal feeds → SOC L3 |
| **Product AI TM**  | markets-os, terminal-os, intelligence/Mythos — replace stubs                |
| **Purple team**    | Quarterly internal pen-test / purple team witness                           |
| **Bug bounty**     | Operationalize `ops/security/narrative/bug-bounty-policy.md`                |
| **PQC**            | `bridge-os/pm/spec/crypto-agility-register.json`                            |
| **AI red-team**    | Fleet rollup from eval-pipeline + anomaly-detector                          |

## Stories (SoR: `pm/secas-stories.json`)

| ID          | Title                                            | Priority |
| ----------- | ------------------------------------------------ | -------- |
| SECAS-S5-01 | Quarterly internal purple-team witness           | P1       |
| SECAS-S5-02 | Product-line threat models — markets, terminal   | P0       |
| SECAS-S5-03 | AI / Mythos threat model + red-team fleet rollup | P0       |
| SECAS-S5-04 | PQC crypto-agility register + harness            | P2       |
| SECAS-S5-05 | Bug bounty program operationalization            | P1       |

## Authority

| Class | Examples                                                                    |
| ----- | --------------------------------------------------------------------------- |
| **R** | Risk/threat register hygiene, purple-team scheduling, bounty triage runbook |
| **A** | Purple-team witness write, bounty scope publish, AI red-team rollup         |
| **S** | Accepted-risk for critical findings, external bounty legal review           |

**`blocksIR: false`** — product repos author app threat models; fabric indexes and assures.

## Harness targets

```bash
pnpm fleet:risk:check:write
pnpm fleet:threat:check:write
pnpm secas:purple-team:check:write      # S5-01 (post-S4)
pnpm secas:ai-redteam:rollup:write      # S5-03
pnpm secas:pqc:check:write              # S5-04
```

## Operator entry

- **Fleet risk SoR:** `bridge-os/pm/spec/fleet-risk-register.json`
- **Active threats:** `bridge-os/pm/spec/fleet-threat-register.json`
- **Bug bounty:** `ops/security/narrative/bug-bounty-policy.md`
- **SOC L3 path:** `docs/operations/soc-operations.md`
