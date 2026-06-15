---
title: Execution roadmap — SecOps
status: current
date: 2026-06-15
last_reconciled: 2026-06-15T16:28:59.182Z
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

## Active Phase: SECAS-S4 — Security engineering operating program (CSIRT, supply chain, vuln cadence)

**Status:** `in_progress`

| Story       | Title                                                                   | Priority | Status | Owner     |
| ----------- | ----------------------------------------------------------------------- | -------- | ------ | --------- |
| SECAS-S4-01 | CSIRT / SOC operating model + incident response runbook SoR             | P0       | done   | fabric-os |
| SECAS-S4-02 | Fleet supply-chain security gates (container + dependency scan witness) | P0       | done   | fabric-os |
| SECAS-S4-03 | Standing vulnerability management cadence + friction register hygiene   | P1       | done   | fabric-os |
| SECAS-S4-04 | Pen-test findings remediation track + re-test witness                   | P0       | done   | fabric-os |
| SECAS-S4-05 | Expand SECaaS cards — terminal-os, fabric-os self, bridge witness repos | P2       | done   | fabric-os |

### SECAS-S4-01: CSIRT / SOC operating model + incident response runbook SoR

**Files:** docs/operations/secas/secas-s4-security-engineering-program.md, docs/operations/secas/csirt-operating-model.md, docs/operations/secas/runbooks/incident-response.md, audit/evidence/secas-csirt-operating-model-latest.json, audit/evidence/secas-ir-drill-2026-06-14.json

**Acceptance**

```bash
pnpm secas:csirt:check:write
```

**UAT / QA**

- [x] CSIRT roles, escalation matrix, and on-call contract documented (csirt-operating-model.md published 2026-06-14)
- [x] Tabletop / drill evidence path defined and witnessed (audit/evidence/secas-ir-drill-2026-06-14.json tabletop PASS)

**Blockers:** none

### SECAS-S4-02: Fleet supply-chain security gates (container + dependency scan witness)

**Files:** platform/scripts/secas-supply-chain-check.mjs, pm/spec/supply-chain-cve-policy.json, docs/operations/secas/supply-chain-policy.md, audit/evidence/secas-supply-chain-check-latest.json

**Acceptance**

```bash
pnpm secas:supply-chain:check:write
```

**UAT / QA**

- [x] Critical/high CVE policy documented with fleet rollup witness
- [x] fabric-os + 3 product repos probed in harness

**Blockers:** none

### SECAS-S4-03: Standing vulnerability management cadence + friction register hygiene

**Files:** pm/spec/vuln-cadence-policy.json, docs/operations/secas/vuln-cadence.md, platform/scripts/secas-vuln-cadence-check.mjs, pm/security-friction-register.json, audit/evidence/secas-vuln-cadence-latest.json

**Acceptance**

```bash
pnpm secas:vuln-cadence:check:write
```

**UAT / QA**

- [x] Weekly vuln triage witness + SLA tiers (P0/P1/P2)
- [x] Open SEC-\* friction items have owner + unblock action

**Blockers:** none

### SECAS-S4-04: Pen-test findings remediation track + re-test witness

**Files:** audit/evidence/pen-test-findings-register-latest.json, audit/evidence/pen-test-remediation-closure-latest.json, audit/evidence/secas-s4-04-internal-closure-2026-06-15.json

**Acceptance**

```bash
pnpm secas:pentest:remediation:check:write
```

**UAT / QA**

- [x] Remediation register + closure scaffold at canonical paths (2026-06-14 — findings register, closure tracker, remediation check script)
- [x] Owner mapping matrix for fabric + product repos (pen-test-findings-register-latest.json owners block)
- [ ] Vendor report findings mapped to owners (fabric + product) (postLaunchExternal BG-10-10-REPORT)
- [ ] Critical/high findings closed or accepted-risk documented (Class S) (post-remediation execution)

**Blockers:** postLaunchExternal BG-10-10-REPORT — then SECAS-S4-04 remediation execution

### SECAS-S4-05: Expand SECaaS cards — terminal-os, fabric-os self, bridge witness repos

**Files:** docs/operations/secas/cards/terminal-os.md, docs/operations/secas/cards/fabric-os.md, docs/operations/secas/cards/bridge-os.md

**Acceptance**

```bash
pnpm secas:cards:check:write
```

**UAT / QA**

- [x] Cards indexed in docs/operations/secas/cards/README.md
- [x] secas:cards:check includes new card paths

**Blockers:** none

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

| Sprint   | Goal                                                                        | Status   | Owner     | Stories / Friction                                                                          |
| -------- | --------------------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------- |
| SECAS-S1 | Sovereign register + security friction SoR                                  | complete | fabric-os |                                                                                             |
| SECAS-S2 | Pen-test ingest scaffolding (internal prep complete)                        | complete | fabric-os | `SEC-PENTEST-01`                                                                            |
| SECAS-S3 | Fleet IRSA + WAF hardening cards                                            | complete | fabric-os |                                                                                             |
| SECAS-S5 | Continuous assurance (purple team, AI red-team, PQC, product threat models) | pending  | fabric-os | `RISK-FLEET-01`, `THR-FLEET-01`, `SECAS-S5-02`, `SECAS-S5-03`, `SECAS-S5-04`, `SECAS-S5-05` |

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
