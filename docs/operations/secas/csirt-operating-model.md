---
title: CSIRT operating model
status: current
date: 2026-06-24
owner: fabric-os
document_type: runbook
tier: operating
review_cycle: quarterly
---

# CSIRT operating model

Cross-repo Computer Security Incident Response Team model for GTCX fleet. Complements [`soc-operations.md`](../runbooks/soc-operations.md).

## Escalation matrix

| Severity | Response SLA      | Primary                        | Escalation                      |
| -------- | ----------------- | ------------------------------ | ------------------------------- |
| SEV-1    | 15 min            | fabric-os SecOps on-call       | Founder + bridge program office |
| SEV-2    | 1 h               | fabric-os SecOps               | Product owner repo              |
| SEV-3    | 4 h               | Product repo security engineer | fabric-os SecOps                |
| SEV-4    | next business day | Product repo                   | backlog only                    |

## On-call contract

- **Primary:** fabric-os SecOps lane (SECAS-S4-01)
- **Secondary:** bridge-os platform-architect persona for fleet coordination
- **Class S:** legal countersign, vendor SOW — parallel sovereign gates only
- Roster visibility: bridge `ecosystem:product-team:check:write`

## Drill cadence

- Quarterly tabletop + machine witness: `audit/evidence/secas-ir-drill-YYYY-MM-DD.json`
- Annual purple-team exercise: SECAS-S5 (`pnpm secas:purple-team:check:write`)
- Post-drill: update `machine/security-friction-register.json` if new friction opens

## References

- SOC plan: [`soc-operations.md`](../runbooks/soc-operations.md)
- IR runbook: [`runbooks/incident-response.md`](./runbooks/incident-response.md)
