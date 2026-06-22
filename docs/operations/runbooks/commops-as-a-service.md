---
title: 'CommOps as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'commops', 'communications', 'fabric']
review_cycle: on-change
---

# CommOps as a Service

Fabric OS owns shared communications substrate: channel contracts,
deliverability evidence, and central secret paths. Product repos own channel UX.

## System of Record

| Artifact             | Path                                                | Role                        |
| -------------------- | --------------------------------------------------- | --------------------------- |
| CommOps spec         | `machine/spec/commops-as-a-service.json`            | Lane contract               |
| Substrate contract   | `machine/commops-substrate-contract.json`           | Channel and secret contract |
| Friction register    | `machine/commops-friction-register.json`            | CommOps friction state      |
| CommOps check        | `platform/scripts/commops-check.mjs`                | Local lane gate             |
| Deliverability check | `platform/scripts/commops-deliverability-check.mjs` | Deliverability witness gate |
| Latest witness       | `audit/evidence/commops-check-latest.json`          | Local CommOps witness       |

## Commands

```bash
pnpm commops:check
pnpm commops:check:write
pnpm commops:deliverability:check:write
```

## Rules

- Shared sender configuration and provider credentials remain Fabric-owned.
- Product repos consume communication substrate by contract and local manifest.
- Deliverability evidence is committed only as redacted witness JSON.
