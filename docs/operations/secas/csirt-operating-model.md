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
- **On-call roster (SoR):** HROps workforce registry [`hrops-workforce-registry.json`](../../../../agile-os/machine/spec/hrops-workforce-registry.json) — rotation maintained by bridge program office
- Roster visibility: bridge `ecosystem:product-team:check:write`

### Rotation

| Slot                | Owner lane                  | Escalation                    |
| ------------------- | --------------------------- | ----------------------------- |
| Weekday primary     | fabric-os SecOps            | bridge platform-architect     |
| Weekend / off-hours | bridge program office       | founder (SEV-1)               |
| TI triage           | fleet-threat-register watch | SECAS-S5 continuous assurance |

## Drill cadence

- Quarterly tabletop + machine witness: `audit/evidence/secas-ir-drill-YYYY-MM-DD.json`
- Annual purple-team exercise: SECAS-S5 (`pnpm secas:purple-team:check:write`)
- Post-drill: update `machine/security-friction-register.json` if new friction opens

## References

- SOC plan: [`soc-operations.md`](../runbooks/soc-operations.md)
- IR runbook: [`runbooks/incident-response.md`](./runbooks/incident-response.md)
