---
title: 'Core Ops Batch A programs'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'core-ops', 'programs', 'fabric']
review_cycle: on-change
---

# Core Ops Batch A programs

Batch A contains the Fabric-owned operational lanes needed for fleet
operationalization and 11-pillar readiness.

## Programs

| Program              | Lane              | Primary check                     |
| -------------------- | ----------------- | --------------------------------- |
| DaaS                 | DevOps / InfraOps | `pnpm daas:friction:check`        |
| SECaaS               | SecOps            | `pnpm secas:friction:check`       |
| EcosystemOps network | EcosystemOps      | `pnpm ecosystemops:network:check` |
| FinOps               | FinOps            | `pnpm finops:check`               |
| PayOps               | PayOps            | `pnpm payops:substrate:readiness` |
| CommOps              | CommOps           | `pnpm commops:check`              |
| AIOps                | AIOps             | `pnpm aiops:check`                |

## Evidence

Each program writes a local witness under `audit/evidence/` and rolls up through
the Fabric 11PR lane witness at
`audit/evidence/fabric-ops-lanes-11pr-latest.json`.
