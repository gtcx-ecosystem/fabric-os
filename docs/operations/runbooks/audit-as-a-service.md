---
title: 'Audit as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'aaas', 'audit', 'fabric']
review_cycle: on-change
---

# Audit as a Service

Fabric OS owns the local Audit-as-a-Service lane for composite audit evidence,
five-core probe consumption, and Fabric assurance witness production.

## System of Record

| Artifact          | Path                                             | Role                           |
| ----------------- | ------------------------------------------------ | ------------------------------ |
| Audit register    | `machine/audit-friction-register.json`           | AAAS friction state            |
| Roadmap           | `machine/aaas-roadmap.json`                      | Fabric-owned AAAS roadmap      |
| Composite witness | `audit/evidence/composite-audit-latest.json`     | Latest composite audit witness |
| AAAS check        | `platform/scripts/aaas-friction-check.mjs`       | Local AAAS gate                |
| Latest witness    | `audit/evidence/aaas-friction-check-latest.json` | Local AAAS witness             |

## Commands

```bash
pnpm aaas:friction:check
pnpm aaas:friction:check:write
```

## Rules

- Fabric OS consumes Bridge OS five-core probes instead of duplicating the fleet
  audit framework.
- Audit evidence must be machine-readable and traceable to the lane register.
- Human or vendor audit artifacts remain parallel gates unless an owner repo
  harness explicitly requires them.
