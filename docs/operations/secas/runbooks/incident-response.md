---
title: Incident response runbook
status: current
date: 2026-06-24
owner: fabric-os
document_type: runbook
tier: operating
review_cycle: quarterly
---

# Incident response runbook

Fleet IR procedures for SecOps. Feeds bridge `fleet-threat-register.json` internal findings.

## Roles

| Role               | Responsibility                                    |
| ------------------ | ------------------------------------------------- |
| Incident commander | fabric-os SecOps — coordinates timeline and comms |
| Scribe             | Records actions in drill witness JSON             |
| Product liaison    | Owner repo engineer for app-layer containment     |
| Legal liaison      | Class S gates only — DPA, regulator notice        |

## Severity

- **SEV-1:** Active exploitation, data breach, fleet control plane compromise
- **SEV-2:** Confirmed vulnerability with known exploit path in staging/production
- **SEV-3:** Suspicious activity requiring investigation
- **SEV-4:** Hardening / hygiene — track in friction register

## Escalation

1. Detect via anomaly-detector, TI feed, or manual report
2. Open internal finding in `fleet-threat-register.json`
3. Execute containment per product threat model
4. File drill/closure witness under `audit/evidence/secas-ir-drill-*.json`
5. Class S legal/vendor gates run in parallel — do not block engineering P22

## Drill evidence path

```text
audit/evidence/secas-ir-drill-YYYY-MM-DD.json
```

Witness schema: `gtcx://fabric-os/secas-ir-drill/v1` — redacted, no secrets.

## Related

- CSIRT model: [`../csirt-operating-model.md`](../csirt-operating-model.md)
- SOC operations: [`../../soc-operations.md`](../../runbooks/soc-operations.md)
