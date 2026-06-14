---
title: Incident response runbook (SECaaS)
status: draft
date: 2026-06-14
owner: fabric-os
story: SECAS-S4-01
friction: SEC-CSIRT-01
---

# Incident response runbook

> **Draft** — SECAS-S4-01 will promote to `current` with drill witness at `audit/evidence/secas-csirt-operating-model-latest.json`.

## Scope

GTCX fleet security incidents affecting staging or production substrate owned by fabric-os (EKS, WAF, secrets, network policy).

## Roles

| Role               | Owner                                            | Responsibility                                 |
| ------------------ | ------------------------------------------------ | ---------------------------------------------- |
| Incident commander | fabric-os security-engineer persona / human CISO | Triage, severity, comms                        |
| Stack remediator   | fabric-os                                        | Terraform/K8s/WAF changes                      |
| Product liaison    | Owner repo                                       | App-layer containment if affected              |
| Evidence custodian | fabric-os                                        | `audit/evidence/` chain, no secrets in witness |

## Severity

| Level | Criteria                                     | Response target       |
| ----- | -------------------------------------------- | --------------------- |
| SEV-1 | Active exploit / data exposure on live stack | Immediate containment |
| SEV-2 | Critical vuln with known exploit path        | Same business day     |
| SEV-3 | Medium findings, misconfig without exploit   | Sprint cadence        |

## Phases (NIST-aligned)

1. **Detect** — CloudTrail, WAF logs, anomaly-detector, pen-test findings register
2. **Contain** — isolate workload, revoke credentials, WAF block
3. **Eradicate** — patch, rotate secrets, terraform apply with evidence
4. **Recover** — smoke probes, `fabric:assurance:check`, product re-probe
5. **Learn** — post-incident note → friction register if systemic

## Escalation

- Class **R/A:** fabric-os executes containment in-session (P27)
- Class **S:** legal/regulatory notification, customer comms — human only

## Drill evidence path

`audit/evidence/secas-ir-drill-YYYY-MM-DD.json` — tabletop or synthetic inject; annual minimum.

## Related

- Persona: `canon-os/.../personas/security-engineer.md`
- Program: [SECAS-S4-security-engineering-program.md](../SECAS-S4-security-engineering-program.md)
