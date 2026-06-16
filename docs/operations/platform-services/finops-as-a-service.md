---
title: 'FinOps — cost attribution and governance'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
initiative: INIT-OPS-LANES-OPERATIONALIZE
protocol: P48
---

# FinOps-as-a-Service

> **Ops lane:** **FinOps** · **Owner:** fabric-os · **Policy SoR:** bridge-os

**Spec:** `pm/spec/finops-as-a-service.json`  
**Friction SoR:** `pm/finops-friction-register.json`  
**Infra cost witness:** `audit/evidence/infra-aws-cost-optimization-latest.json`  
**Fleet witness:** `bridge-os/pm/ci/ops-lanes-100/finops-fleet-latest.json`

## Scope

| Owns (fabric-os)                                                               | Does not own                      |
| ------------------------------------------------------------------------------ | --------------------------------- |
| Terraform `cost-profile` module wiring (staging scheduled / testnet ephemeral) | Product SaaS pricing (RevOps)     |
| Infra cost audit harness (`pnpm infra:cost:audit:write`)                       | Payment rails (PayOps)            |
| Lane-attribution tags on fleet deploy artifacts                                | Legal contract pricing (LegalOps) |

## Verification

```bash
pnpm finops:check:write
pnpm infra:cost:audit:write
```

## Runtime ops (bridge-os)

```bash
pnpm --dir ../bridge-os env:cost:report:write
pnpm --dir ../bridge-os env:governance:check
```

## Open friction

See `pm/finops-friction-register.json` — P1 items for full module tag enforcement and baseline cost-stats rollup.
