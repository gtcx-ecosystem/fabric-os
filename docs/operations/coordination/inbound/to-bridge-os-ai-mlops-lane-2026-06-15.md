---
title: 'Inbound — AI/MLOps program lane (bridge-os owner)'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['coordination', 'documentation']
review_cycle: on-change
document_type: coordination
---

# Inbound — AI/MLOps program lane

**From:** `fabric-os` · **Branch:** `feature/ai-mlops`  
**To:** `bridge-os` (AIOps program owner + fleet witness SoR)

## Owner contract

| Lane          | Owner       | Co-owner    |
| ------------- | ----------- | ----------- |
| **AIOps**     | bridge-os   | baseline-os |
| **MLOps**     | baseline-os | bridge-os   |
| **Substrate** | fabric-os   | —           |

Lanes do **not** run through `gtcx-os` or `gtcx-intelligence`.

## bridge-os actions

1. Keep `ops-programs-registry.json` + `ops-lanes-100-plan.json` aligned
2. Run `pnpm ecosystem:aiops:check:fleet:write`
3. Remove `gtcx-intelligence` / `gtcx-os` from MLOps/AIOps owner fields
4. Coordinate with baseline-os on MLOps check implementation

## fabric substrate witness

`fabric-os/pnpm aiops:check:write` — substrate signals only (anomaly-detector, eval-pipeline, injection-suite).
