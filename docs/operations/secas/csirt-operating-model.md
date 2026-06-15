---
title: 'CSIRT operating model (SECaaS)'
status: current
date: 2026-06-14
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
story: SECAS-S4-01
friction: SEC-CSIRT-01
opsLane: SecOps
---

# CSIRT operating model

> **Ops lane:** SecOps (SECaaS). Standing incident response function for fabric-os substrate — parallel to pen-test window (`SECAS-S2-01`, `blocksIR: false`).

## Scope

Fleet security incidents on fabric-os-owned substrate: EKS, WAF, secrets, network policy, observability stack. App-layer containment routes to **owner repo** liaisons.

## CSIRT roster (fleet phase)

| Role                    | Primary                             | Backup                      | Availability             |
| ----------------------- | ----------------------------------- | --------------------------- | ------------------------ |
| Incident commander (IC) | fabric-os security-engineer persona | Human CISO                  | Business hours + on-call |
| Stack remediator        | fabric-os platform-engineer         | fabric-os DevOps            | On-call rotation         |
| Evidence custodian      | fabric-os                           | bridge-os assurance witness | Per incident             |
| Product liaison         | Owner-repo security contact         | Repo lead                   | Per affected product     |
| Comms / legal           | Human operator (Class S)            | —                           | SEV-1 only               |

Persona SoR: `canon-os/docs/governance/institutional/personas/security-engineer.md`

## Severity → response SLA

| Level | Criteria                                                 | IC notified       | Containment target | Escalation             |
| ----- | -------------------------------------------------------- | ----------------- | ------------------ | ---------------------- |
| SEV-1 | Active exploit or confirmed data exposure on live stack  | Immediate         | 30 minutes         | CISO + legal (Class S) |
| SEV-2 | Critical vuln with known exploit path; no active exploit | 1 hour            | Same business day  | CISO advisory          |
| SEV-3 | Misconfig or medium finding without exploit path         | Next business day | Sprint cadence     | IC only                |

## Escalation matrix

| Trigger                                 | L1 (detect/triage)                   | L2 (investigate)          | L3 (command)         | Class |
| --------------------------------------- | ------------------------------------ | ------------------------- | -------------------- | ----- |
| GuardDuty / WAF critical alert          | fabric-os automated + analyst triage | security-engineer persona | Human CISO           | R/A   |
| Pen-test critical finding (post-ingest) | friction register owner              | stack remediator          | IC                   | R/A   |
| Credential compromise                   | revoke + rotate (P27)                | terraform/k8s patch       | IC + product liaison | R/A   |
| Regulatory / customer notification      | —                                    | —                         | Human operator       | **S** |
| Nation-state / APT indicator            | threat register update               | L3 + TI feed              | CISO + counsel       | A/S   |

## On-call contract

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Rotation      | Weekly — fabric-os platform + security pair                        |
| Pager channel | `#secops-oncall` (Slack) + PagerDuty (planned L3)                  |
| Handoff       | Monday 08:00 SAST — prior IC posts open items to friction register |
| Ack SLA       | SEV-1: 15 min · SEV-2: 1 h · SEV-3: next business day              |
| Out of scope  | Product-only bugs without security impact → owner repo             |

**L2 managed SOC** (business-hours playbooks): see [soc-operations.md](../core-ops/batch-b/soc-operations.md).  
**L3 24/7 SIEM** target: 2027-Q1 per SOC roadmap — CSIRT model above bridges L1→L3.

## Drill cadence

| Type                       | Frequency         | Evidence path                                   |
| -------------------------- | ----------------- | ----------------------------------------------- |
| Tabletop (fleet IR)        | Quarterly minimum | `audit/evidence/secas-ir-drill-YYYY-MM-DD.json` |
| Synthetic inject (staging) | Annual            | Same path + `fabric:assurance:check` witness    |
| Post-incident review       | Per SEV-1/SEV-2   | Friction register item if systemic              |

## Related artifacts

| Artifact                | Path                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| IR runbook              | [runbooks/incident-response.md](./runbooks/incident-response.md) |
| Friction SoR            | `pm/security-friction-register.json` — `SEC-CSIRT-01`            |
| Fleet threats           | `bridge-os/pm/spec/fleet-threat-register.json`                   |
| Harness                 | `pnpm secas:csirt:check:write`                                   |
| Operating model witness | `audit/evidence/secas-csirt-operating-model-latest.json`         |
