---
title: SOC operations — L2 to L3 maturity plan
status: current
date: 2026-06-24
owner: fabric-os
document_type: runbook
tier: operating
protocol: SECAS-S4-01
review_cycle: quarterly
---

# SOC operations

Fabric-os coordinates fleet SecOps with bridge-os risk/threat registers and product-repo threat models. Current maturity: **L2 partial** → target **L3** (2026-Q3).

## Scope

| Layer            | Owner     | Artifact                                              |
| ---------------- | --------- | ----------------------------------------------------- |
| Fleet risk index | bridge-os | `pm/spec/fleet-risk-register.json`                    |
| Active threats   | bridge-os | `pm/spec/fleet-threat-register.json`                  |
| CSIRT model      | fabric-os | `docs/operations/secas/csirt-operating-model.md`      |
| IR runbook       | fabric-os | `docs/operations/secas/runbooks/incident-response.md` |
| Anomaly detector | fabric-os | `platform/tools/anomaly-detector`                     |

## L2 capabilities (operational)

- Security friction register + SECaaS harness (`pnpm secas:friction:check:write`)
- Fleet risk/threat machine witnesses (`pnpm fleet:risk:check:write`, `pnpm fleet:threat:check:write`)
- Internal IR drill evidence (`audit/evidence/secas-ir-drill-*.json`)
- Anomaly detector scaffold for staging signals

## L3 uplift (planned)

| Workstream                    | Story                 | Gate                        |
| ----------------------------- | --------------------- | --------------------------- |
| SIEM selection + ingest       | WC-SECOPS-007         | Class A — vendor            |
| On-call rotation + paging     | WC-SECOPS-007         | bridge HROps roster         |
| TI feed operationalization    | fleet-threat-register | `threat-intel` source count |
| anomaly-detector → IR runbook | WC-SECOPS-007         | tie-break automation        |

## Operator commands

```bash
pnpm fleet:risk:check:write
pnpm fleet:threat:check:write
pnpm secas:csirt:check:write
pnpm --dir ../bridge-os ecosystem:ops-lanes-100:check:write
```

## Links

- CSIRT operating model: [`secas/csirt-operating-model.md`](../secas/csirt-operating-model.md)
- Incident response: [`secas/runbooks/incident-response.md`](../secas/runbooks/incident-response.md)
- Continuous assurance: [`secas/secas-s5-continuous-assurance-program.md`](../secas/secas-s5-continuous-assurance-program.md)
