---
title: 'SECAS S5 continuous assurance program'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'secops', 'continuous-assurance', 'fabric']
review_cycle: on-change
---

# SECAS S5 continuous assurance program

SECAS S5 keeps Fabric security evidence current after the internal closure
phase: vulnerability cadence, CSIRT model, purple-team evidence, PQC posture,
and AI red-team rollups.

## Checks

```bash
pnpm secas:vuln-cadence:check
pnpm secas:csirt:check
pnpm secas:purple-team:check
pnpm secas:pqc:check
pnpm secas:ai-redteam:rollup
```

## Evidence

The program writes redacted witnesses under `audit/evidence/` and feeds the
Fabric-owned 11-pillar Ops lane witness.
