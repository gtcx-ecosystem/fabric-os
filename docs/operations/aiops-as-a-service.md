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

AIOps lane ownership is **bridge-os** (fleet program office) + **baseline-os** (AI OS runtime). fabric-os hosts **substrate signals** only: anomaly detection, eval gates, injection red-team evidence, and GCP ML bridge deploy artifacts.

## Ownership

| Role               | Repo        |
| ------------------ | ----------- |
| AIOps program      | bridge-os   |
| AI runtime / MLOps | baseline-os |
| Deploy substrate   | fabric-os   |

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
