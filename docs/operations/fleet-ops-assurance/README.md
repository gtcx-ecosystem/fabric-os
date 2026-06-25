---
title: Fleet Ops Assurance Program
status: current
date: 2026-06-24
owner: fabric-os
document_type: ops-entry
tier: operating
---

# Fleet Ops Assurance Program

**Operator entry** for centralized security, compliance, legal, and ops-lane operationalization across the GTCX fleet.

## One command

```bash
pnpm fleet-ops-assurance:check:write
pnpm --dir ../bridge-os ecosystem:fleet-ops-assurance:check:write
```

## Programme SoR

| Artifact                  | Path                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| Program spec              | `pm/spec/fleet-ops-assurance-program.json`                          |
| Central assurance backlog | `pm/spec/central-assurance-program.json`                            |
| Ops lane routing          | `pm/spec/ops-lane-prd-routing-matrix.json`                          |
| Friction rollup           | `machine/fleet-ops-friction-register.json`                          |
| Execution roadmap         | `audit/product-management/fleet-ops-assurance-execution-roadmap.md` |

## Lane owners

| Lane             | Owner         | Harness                                                       |
| ---------------- | ------------- | ------------------------------------------------------------- |
| SecOps           | fabric-os     | `pnpm secas:friction:check:write`                             |
| LegalOps         | fabric-os     | `pnpm legal:friction:check:write`                             |
| ComplianceOps    | compliance-os | `pnpm --dir ../compliance-os complianceops:check:write`       |
| FleetOps         | fabric-os     | `pnpm central-assurance:check:write`                          |
| All lanes rollup | bridge-os     | `pnpm --dir ../bridge-os ecosystem:ops-lanes-100:check:write` |

## Parallel assurance rule

Pen test, SOC2, DPA, legal Class S gates **never** block product P22, sprint seal, or `gtm.stage`. Status Update section: **Parallel assurance lane**.

Policy: `baseline-os/machine/spec/maturity-lane-separation.json` (GS-MATURITY-LANE-001, GS-GTM-STAGE-002).
