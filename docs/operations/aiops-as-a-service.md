---
title: 'AIOps-as-a-Service'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['runbook', 'aiops', 'ops-lane', 'P49']
review_cycle: on-change
document_type: runbook
protocol: 'P49'
---

# AIOps-as-a-Service

AIOps operates fleet AI reliability: anomaly detection, eval gates, injection red-team evidence, and agent conduct integration. MLOps model lifecycle is owned by `gtcx-intelligence`; fabric-os owns substrate signals and the GCP ML bridge.

## Harness

```bash
pnpm aiops:check
pnpm aiops:check:write
pnpm --dir ../bridge-os ecosystem:aiops:check:fleet:write
```

## Artifacts

| Artifact     | Path                                     |
| ------------ | ---------------------------------------- |
| Spec         | `pm/spec/aiops-as-a-service.json`        |
| MLOps bridge | `pm/spec/mlops-bridge-contract.json`     |
| Signals      | `pm/aiops-signals-register.json`         |
| Friction     | `pm/aiops-friction-register.json`        |
| Witness      | `audit/evidence/aiops-check-latest.json` |
