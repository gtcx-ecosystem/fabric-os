---
title: 'Fleet QA report — security, compliance, GTM, revenue'
status: current
date: 2026-06-25
owner: fabric-os
document_type: report
tier: operating
tags: ['operations', 'fleet', 'qa', 'security', 'compliance', 'gtm', 'revenue']
review_cycle: on-change
---

# Fleet QA report — security, compliance, GTM, revenue

Generated: `2026-06-25T10:36Z`
Scope: all GTCX ecosystem repos with `.git` checkout

## Executive summary

| Domain                  | Gate                                                   | Result                                      |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Security (SECaaS)       | `pnpm --dir bridge-os ecosystem:secas:check`           | ✅ PASS 12/12                               |
| Fleet risk register     | `pnpm --dir bridge-os fleet:risk:check`                | ✅ PASS (10 risks, 0 errors)                |
| Fleet threat register   | `pnpm --dir bridge-os fleet:threat:check`              | ✅ PASS (4 threats, 0 errors)               |
| ComplianceOps           | `pnpm --dir bridge-os ecosystem:complianceops:check`   | ✅ PASS (compliance-os 100/100 all pillars) |
| Five-core audit (fleet) | `pnpm --dir bridge-os ecosystem:audit:five-core:fleet` | ✅ PASS 20/20 repos                         |
| Ecosystem status        | `pnpm --dir bridge-os ecosystem:status:report`         | ⚠️ PASS 4/5 staging healthy                 |
| Fleet clarity / GTM     | `pnpm --dir bridge-os ecosystem:clarity:report`        | ⚠️ 144 programme points remaining           |
| RevOps fleet            | `pnpm --dir bridge-os ecosystem:revops:check`          | ❌ FAIL (`opsEntry` on fabric-os)           |

## Security

### SECaaS functional gate (P42)

Run from bridge-os program office. All 12 gates pass:

- spec, infraSecRegister, infraApprovalRegister, infraRoadmap
- infraStories, infraOps, infraSecasIndex, infraTasks
- infraFrictionCheck, infraApprovalCheck, infraCardsCheck, hubProtocol

### Fleet risk & threat registers

- **Risks:** 10 tracked, 0 validation errors
- **Threats:** 4 tracked, 0 validation errors

### Per-repo security posture

Security posture is maintained in fabric-os `operations/security/posture.json` and consumed by product repos. Current controls operational:

- SECaaS friction register, approval witness, supply-chain check
- CSIRT operating model + IR runbook + internal drill evidence
- Staging anomaly detector scaffold
- Fleet staging secret lifecycle (ESO + IRSA) — in_progress for markets-os

## Compliance

### Five-core fleet audit

20/20 repos pass the probe-driven five-core audit (composite 100/100):

agile-os, baseline-os, bridge-os, canon-os, compliance-os, ecosystem-os, exploration-os, fabric-os, griot-ai, gtcx-os, inspection-os, ledger-os, ledger-ui, markets-os, nyota-ai, sensei-os, terminal-os, terra-os, venture-os, veritas-ai

### ComplianceOps lane (P50)

- **compliance-os:** 100/100 across all 11 pillars (F-PiLLAR + T-PiLLAR)
- Evidence: spec + runbook + registers + local check

### MPR compliance scores (selected repos)

| Repo          | Compliance |     TE      |    Craft    | World-class | Trust & Safety | Status |
| ------------- | ---------: | :---------: | :---------: | :---------: | :------------: | :----: |
| fabric-os     |        100 |   100 pub   |   100 pub   |   100 pub   |    100 full    |   ✅   |
| terminal-os   |        100 |   100 pub   |   100 pub   |   100 pub   |    100 full    |   ✅   |
| bridge-os     |        100 |   100 pub   |   100 pub   |   100 pub   |    100 full    |   ✅   |
| compliance-os |        100 |   100 pub   |   100 pub   |   100 pub   |    100 full    |   ✅   |
| markets-os    |        100 |   100 pub   |   100 pub   |   100 pub   |    100 full    |   ✅   |
| terra-os      |        100 |   100 pub   |   100 pub   |   100 pub   |    100 full    |   ✅   |
| gtcx-markets  |    69 prov | 100 blocked | 100 blocked | 100 blocked |   84 partial   |   ⚠️   |

_gtcx-markets compliance is provisional (69), blocking TE/Craft/World-class publication and leaving Trust & Safety at partial unlock._

## GTM / Fleet status

### Staging health

- **Overall:** PASS (4/5 healthy, 0 required services unhealthy)
- **Unhealthy optional:** compliance-gateway (fabric-os) — HTTP 525 / kubectl exec timeout

### Pilot/demo readiness

- **Pilot-ready repos:** compliance-os, nyota-ai, terminal-os, terra-os (4)
- **Deploy-ready repos:** compliance-os, nyota-ai, terminal-os, terra-os (4)

### Repo composite snapshot

| Repo           | Composite | Deploy ready | Staging | Pilot ready | P22 head                   |
| -------------- | --------: | :----------: | :-----: | :---------: | -------------------------- |
| compliance-os  |       100 |      ✅      |    —    |     ✅      | complete_milestones        |
| exploration-os |       100 |      —       | ✅ 2/2  |      —      | S11-01                     |
| ledger-ui      |       100 |      —       |    —    |      —      | —                          |
| nyota-ai       |      97.4 |      ✅      |    —    |     ✅      | —                          |
| sensei-os      |       100 |      —       | ✅ 1/1  |      —      | BACKLOG-CLEAR              |
| terminal-os    |       100 |      ✅      |    —    |     ✅      | —                          |
| terra-os       |       100 |      ✅      |    —    |     ✅      | —                          |
| baseline-os    |        94 |      —       |    —    |      —      | INIT-FIVE-PILLAR-FLEET-100 |
| fabric-os      |       100 |      —       | ⚠️ 0/1  |      —      | SECAS-S2-01                |
| markets-os     |        99 |      —       |    —    |      —      | IR-006                     |
| griot-ai       |        59 |      —       |    —    |      —      | —                          |
| venture-os     |        59 |      —       |    —    |      —      | —                          |
| veritas-ai     |        59 |      —       |    —    |      —      | —                          |

### Deployment proof register

- EAP issuance evidence (Protocol 23): ✅ done
- Sovereign CSP countersign (H-03 Class S): ⏳ awaiting-human

### Fleet clarity / programme remaining

- **North star:** GR-T2 integrator pilot
- **Programme points remaining:** 144
- **Sprints sealed:** 17/17
- **Head programme:** PROG-CONTINENTAL-CAPITAL → markets-os

Key milestones:

| Repo          | Milestone                             | DoD |
| ------------- | ------------------------------------- | --- |
| markets-os    | M4 — golden transaction + AFM program | 3/3 |
| compliance-os | DEPLOY-GATE-85                        | 3/3 |
| terra-os      | Pilot-demo-ready                      | 3/3 |
| ecosystem-os  | ECO-OS-SHIP-001                       | 3/4 |
| baseline-os   | STUDIO-004 dual-anchor                | 2/3 |
| canon-os      | INIT-DOC-PROMOTION-M4                 | 1/2 |

## Revenue / RevOps

### RevOps fleet harness (P51)

- **Result:** FAIL
- **Failure:** `opsEntry` gate fails on current fabric-os branch
- **Witness source:** git branch `feature/fabric-ops-w1` (revops-friction-check, unit-economics, pricing-check all pass there)
- **Handoff:** XR-FABRIC-OPS-LANES-001

### Revenue indicators

- Continental capital + digital-rail Wave 0 programme active in markets-os
- 60-day bank innovation pilot operating kit active
- African Financial Markets Regulatory Adapter programme active
- RevOps evidence exists on fabric-os `feature/fabric-ops-w1` but is not merged to `main`

## Red / blocked items

| Item                                            | Repo / lane     | Class | Block                                                            |
| ----------------------------------------------- | --------------- | ----- | ---------------------------------------------------------------- |
| gtcx-markets compliance provisional             | gtcx-markets    | R     | Layout/workspace gaps; compliance 69 blocks T-PiLLAR publication |
| compliance-gateway staging unhealthy            | fabric-os       | A     | kubectl exec timeout / HTTP 525                                  |
| RevOps opsEntry missing on main                 | fabric-os       | R     | XR-FABRIC-OPS-LANES-001 handoff not merged                       |
| griot-ai / venture-os / veritas-ai composite 59 | product repos   | R     | Below 85 threshold; not pilot/deploy ready                       |
| H-03 sovereign CSP countersign                  | gtcx-os / legal | S     | Awaiting human counter-signature                                 |

## Commands run

```bash
# Security
pnpm --dir bridge-os ecosystem:secas:check:write
pnpm --dir bridge-os fleet:risk:check:write
pnpm --dir bridge-os fleet:threat:check:write

# Compliance
pnpm --dir bridge-os ecosystem:complianceops:check:write
pnpm --dir bridge-os ecosystem:audit:five-core:fleet --write
node bridge-os/platform/scripts/ecosystem/run-mpr-repo-audit.mjs --repo <repo> --write

# GTM / status
pnpm --dir bridge-os ecosystem:status:report:write
pnpm --dir bridge-os ecosystem:clarity:report --brief --write

# Revenue
pnpm --dir bridge-os ecosystem:revops:check:write
```

## Witnesses

- `bridge-os/pm/ci/secas-check-latest.json`
- `bridge-os/audit/evidence/fleet-risk-check-latest.json`
- `bridge-os/audit/evidence/fleet-threat-check-latest.json`
- `bridge-os/pm/ci/complianceops-fleet-latest.json`
- `bridge-os/pm/ci/five-core-fleet-probe-latest.json`
- `bridge-os/pm/ci/ecosystem-status-report-latest.json`
- `bridge-os/pm/ci/ecosystem-clarity-report-latest.md`
- `bridge-os/pm/ci/ops-lanes-100/revops-fleet-latest.json`
