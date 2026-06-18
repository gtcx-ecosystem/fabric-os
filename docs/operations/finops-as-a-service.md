---
title: 'FinOps as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'finops', 'cost', 'fabric']
review_cycle: on-change
---

# FinOps as a Service

Fabric OS owns infrastructure cost attribution, cost-policy consumption, and
fleet cost witnesses. Bridge OS remains the policy system of record.

## System of Record

| Artifact          | Path                                             | Role                 |
| ----------------- | ------------------------------------------------ | -------------------- |
| FinOps spec       | `pm/spec/finops-as-a-service.json`               | Lane contract        |
| Friction register | `pm/finops-friction-register.json`               | Cost friction state  |
| Cost audit        | `platform/scripts/cost/run-infra-cost-audit.mjs` | AWS cost evidence    |
| FinOps check      | `platform/scripts/finops-check.mjs`              | Local lane gate      |
| Latest witness    | `audit/evidence/finops-check-latest.json`        | Local FinOps witness |

## Commands

```bash
pnpm finops:check
pnpm finops:check:write
pnpm infra:cost:audit:write
```

## Rules

- Fabric OS writes redacted cost witnesses only.
- Cost policy and governance specs are consumed from Bridge OS.
- Product repos do not own shared cloud cost policy.
