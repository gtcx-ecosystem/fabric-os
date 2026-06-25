---
initiativeId: INIT-FLEET-OPS-ASSURANCE-PROGRAM
title: Fleet Ops Assurance Program
status: in_progress
priority: P0
owner: fabric-os
programmeId: PROG-FLEET-OPS-ASSURANCE
date: 2026-06-24
---

# INIT-FLEET-OPS-ASSURANCE-PROGRAM

Centralized operational programme for **all ops functions** — SecOps, LegalOps, ComplianceOps, FleetOps, DaaS, and bridge `ops-lanes-100` rollup.

## Shippable outcome

fabric-os owns external assurance backlog; every ops lane has owner-routed PRD, friction register, harness, and fleet witness; product repos reference witness IDs only; assurance never blocks engineering or gtm.stage.

## SoR

| Artifact          | Path                                                                |
| ----------------- | ------------------------------------------------------------------- |
| Program spec      | `pm/spec/fleet-ops-assurance-program.json`                          |
| Roadmap JSON      | `machine/fleet-ops-assurance-roadmap.json`                          |
| Stories           | `machine/fleet-ops-assurance-stories.json`                          |
| Friction rollup   | `machine/fleet-ops-friction-register.json`                          |
| Execution roadmap | `audit/product-management/fleet-ops-assurance-execution-roadmap.md` |
| Master harness    | `pnpm fleet-ops-assurance:check:write`                              |
| Bridge rollup     | `pnpm --dir ../bridge-os ecosystem:fleet-ops-assurance:check:write` |

## Related

- `INIT-OPS-LANES-OPERATIONALIZE` (bridge-os)
- `INIT-XR-FLEET-MATURITY-LANES`
- `INIT-ECOSYSTEM-LEGAL-PROGRAM`
- `INIT-GTCX-INFRA-SECAS`
