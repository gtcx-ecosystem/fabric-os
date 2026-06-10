---
title: Security-as-a-Service (SECaaS)
status: current
date: 2026-06-10
owner: gtcx-infrastructure
protocol: P42-SECURITY-AS-A-SERVICE
initiative: INIT-GTCX-INFRA-SECAS
---

# Security-as-a-Service — gtcx-infrastructure

**Normative:** `gtcx-docs/.../42-security-as-a-service/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/security-as-a-service.v1.json`  
**Operational friction:** `pm/security-friction-register.json`  
**Class S gates:** `pm/sovereign-approval-register.json`  
**Roadmap:** `pm/secas-roadmap.json`

## Obligation

Stack security operations (WAF, IRSA, network policy, pen-test **execution**, security evidence) are a **separate concern** from product engineering — parallel to **DaaS** (P41) and **assurance normative** (protocols/core).

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
2. Stack security handoff → `to-gtcx-infrastructure-{topic}-YYYY-MM-DD.md`
3. Re-probe when `from-gtcx-infrastructure-*` security seal **delivered**

## Infra interface

```bash
pnpm secas:friction:check
pnpm secas:approval:check
pnpm agent:next-work
```

## Operator entry

**Approval needed (Class S only):**

- **EXT-INF-002** — approved 2026-06-10; next: vendor countersign
- **BL-SOC2-01** — SOC 2 Type I auditor engagement

**Next operational (Class R/A):**

- **SEC-PENTEST-01** — schedule live-stack pen-test after vendor ack
