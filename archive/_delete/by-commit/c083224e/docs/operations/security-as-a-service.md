---
title: SecOps (SECaaS functional product)
status: current
date: 2026-06-14
owner: fabric-os
protocol: P42-SECURITY-AS-A-SERVICE
initiative: INIT-GTCX-INFRA-SECAS
opsLane: SecOps
---

# SecOps — fabric-os stack security program

> **Ops vocabulary:** **SecOps** — WAF, IRSA, pen-test, CSIRT, vuln cadence, security evidence.  
> **Functional product ID:** **SECaaS** — stable in protocols, `pnpm secas:*`, and `SECAS-S*` stories.  
> **Registry:** [ops-programs.md](./ops-programs.md) · `bridge-os/pm/spec/ops-programs-registry.json`

**Normative:** `canon-os/.../42-security-as-a-service/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/security-as-a-service.json`  
**Operational friction:** `pm/security-friction-register.json`  
**Class S gates:** `pm/sovereign-approval-register.json`  
**Roadmap SoR:** `pm/secas-roadmap.json`  
**Stories SoR:** `pm/secas-stories.json`  
**Execution roadmap:** `audit/product-management/secas-execution-roadmap.md`  
**Task inbox:** `pm/_tasks` — `INIT-GTCX-INFRA-SECAS`

## Obligation

**SecOps** stack security (WAF, IRSA, network policy, pen-test **execution**, CSIRT, vuln cadence, security evidence) is a **separate concern** from product engineering — parallel to **DevOps/InfraOps** (DaaS, P41) and **ComplianceOps** / assurance normative (protocols/core).

Product PM does **not** own pen-test scheduling, WAF apply, or sovereign SOW signature.

## Two registers (do not conflate)

| Register                           | Authority     | Agent behavior                                       |
| ---------------------------------- | ------------- | ---------------------------------------------------- |
| `sovereign-approval-register.json` | **Class S**   | **Approval needed** — prepare intake, never sign SOW |
| `security-friction-register.json`  | **Class R/A** | Execute in-session after sovereign approval          |

**`blocksIR: false`** for both — engineering and IR continue.

## EXT-INF-002 example

| Step                                | Owner               | Class                                  |
| ----------------------------------- | ------------------- | -------------------------------------- |
| Intake pack (RFP, scope, shortlist) | gtcx-infrastructure | R                                      |
| Sovereign SOW approval              | Human / Security    | **S** — recorded `approved` 2026-06-10 |
| Vendor countersign + kickoff        | Human / Procurement | S                                      |
| Pen-test window + evidence          | gtcx-infrastructure | A/R — `SEC-PENTEST-01`                 |

Witness: `audit/evidence/ext-inf-002-sow-approval-2026-06-10.json`

## Product interface

1. App security controls stay in product `09-security/`
2. Stack security handoff → `to-fabric-os-{topic}-YYYY-MM-DD.md`
3. Re-probe when `from-fabric-os-*` security seal **delivered**

## Four-plane model (Ops naming)

| Plane           | Ops lane            | Owner                      | Product engineering                                   |
| --------------- | ------------------- | -------------------------- | ----------------------------------------------------- |
| **Engineering** | Product engineering | Product repo               | Features, tests, app security controls                |
| **Delivery**    | DevOps              | fabric-os                  | Deploy handoff only (P41)                             |
| **Security**    | **SecOps**          | **fabric-os**              | Stack security handoff — WAF, IRSA, pen-test window   |
| **Assurance**   | ComplianceOps       | gtcx-core + gtcx-protocols | Normative only — witness parallel (`blocksIR: false`) |

## Infra interface

1. Triage security inbound → `pm/security-friction-register.json`
2. Class S gates → `pm/sovereign-approval-register.json` (witness only)
3. Execute on `pm/secas-roadmap.json` sprints (SECAS-S\*)
4. Seal with `from-fabric-os-*` + `audit/evidence/secas-*-latest.json`

```bash
pnpm agent:next-work              # P22 — infra programs (DevOps + SecOps)
pnpm generate:secas-roadmap       # refresh SecOps execution roadmap
pnpm secas:friction:check
pnpm secas:approval:check
pnpm secas:cards:check
pnpm secas:pentest:ingest:check:write   # SECAS-S2-01 — pre-window PASS; complete when report ingested
```

## SECAS-S4 — SecOps engineering program (in progress)

Standing **SecOps engineering** wave runs **parallel** to pen-test witness (`SECAS-S2-01`, `blocksIR: false`) — CSIRT, supply chain, vuln cadence, remediation.

| Doc         | Path                                                             |
| ----------- | ---------------------------------------------------------------- |
| Program     | `docs/operations/secas/secas-s4-security-engineering-program.md` |
| CSIRT model | `docs/operations/secas/csirt-operating-model.md`                 |
| IR runbook  | `docs/operations/secas/runbooks/incident-response.md`            |
| Stories     | `pm/secas-stories.json` — `SECAS-S4-01` … `SECAS-S4-05`          |

S4 friction: `SEC-CSIRT-01`, `SEC-SUPPLY-01`, `SEC-VULN-01`, `SEC-PTREM-01` in `pm/security-friction-register.json`.

```bash
pnpm secas:csirt:check:write         # SECAS-S4-01 structural
pnpm secas:supply-chain:check:write   # SECAS-S4-02 fleet rollup (policy + 4-repo witness)
```

## SECAS-S5 — Continuous assurance (queued)

| Doc            | Path                                                             |
| -------------- | ---------------------------------------------------------------- |
| Program        | `docs/operations/secas/secas-s5-continuous-assurance-program.md` |
| Fleet risk SoR | `bridge-os/pm/spec/fleet-risk-register.json`                     |
| Active threats | `bridge-os/pm/spec/fleet-threat-register.json`                   |
| PQC register   | `bridge-os/pm/spec/crypto-agility-register.json`                 |

```bash
pnpm fleet:risk:check:write
pnpm fleet:threat:check:write
```

## World-class gap status (2026-06-14)

| Priority | Item                                                      | Status                                                            |
| -------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| 1        | Unified fleet risk register (machine JSON)                | **in_progress** — register + harness; product TM stubs remain     |
| 2        | Active threat register → SOC L3                           | **in_progress** — register + harness; TI feed planned             |
| 3        | Product AI threat models (markets, terminal, Mythos)      | **open** — stubs/missing in owner repos                           |
| 4        | SECAS-S4 harnesses (CSIRT, supply-chain, vuln)            | **partial** — S4-01 + S4-02 structural PASS; vuln cadence pending |
| 5        | SECAS-S5 proposal (purple team, bounty, PQC, AI red-team) | **drafted** — roadmap + program doc                               |
| 6        | Legal program parity                                      | **thin** — `legal-friction-register` minimal vs SECAS depth       |
| 7        | SOC L2→L3 (SIEM, on-call, anomaly→IR)                     | **planned** — `soc-operations.md` L2 partial                      |

**Resolved?** SECAS-S4/S5 **blueprint** yes (SoR pattern matches compliance/legal). **Harnesses + product threat content** — not yet world-class.

## Cross-repo false blocks (baseline-os M3 pattern)

Repos that label Class S items **blocked** on security/compliance are usually **false blocks** per
[`human-gate-navigation.md`](https://github.com/gtcx-ecosystem/baseline-os/blob/main/docs/operations/human-gate-navigation.md).
Use **Approval needed** — `blocksIR: false` — implement/witness queues continue.

| Approval needed (your list)     | Hub SoR ID     | Repo-local alias         | SECaaS register         | blocksClaims only                  |
| ------------------------------- | -------------- | ------------------------ | ----------------------- | ---------------------------------- |
| H-05 / EXT-INF-002 pen-test SOW | H-05           | baseline-os **BG-10-10** | **approved** 2026-06-10 | `pen-test complete`                |
| BG-10-11 SOC 2 auditor          | BL-SOC2-01     | baseline-os **BG-10-11** | approved 2026-06-10     | `SOC 2 attested`                   |
| BG-10-12 operator witnesses     | BL-OPERATOR-01 | baseline-os **BG-10-12** | _baseline-os owner_     | `non-core engineer baseline proof` |

**ID collision:** gtcx-docs **BG-10-11/12** are M2 Q2/Q3 hygiene gates (automatable, done) — different
stories from baseline-os M3 Class S gates. Resolve by **owner repo**, not ID alone.

Fleet reconciliation spec: `bridge-os/pm/spec/sovereign-gate-reconciliation.json`

## Operator entry

**Approval needed (Class S only):**

- **EXT-INF-002 / H-05 / BG-10-10** — sovereign SOW approved 2026-06-10; next: vendor countersign
- **BL-SOC2-01 / BG-10-11** — SOC 2 Type I auditor engagement
- **BL-OPERATOR-01 / BG-10-12** — named non-core operator workflow (baseline-os register — parallel)

**Next operational (Class R/A):**

- **SEC-PENTEST-01** — pen-test window 2026-06-17..21; ingest scaffold ready — await vendor report at `audit/evidence/pen-test-report-YYYY-MM-DD.json`
