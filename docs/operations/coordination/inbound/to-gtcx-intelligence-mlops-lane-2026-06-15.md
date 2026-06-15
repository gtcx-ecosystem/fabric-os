---
title: 'Inbound — MLOps lane (gtcx-intelligence owner)'
status: current
date: 2026-06-15
owner: fabric-os
document_type: coordination
---

# Inbound — MLOps lane operationalization

**From:** `fabric-os` · **Branch:** `feature/ai-mlops`  
**To:** `gtcx-intelligence` (MLOps owner)

fabric-os ships substrate on this branch:

- `pm/spec/mlops-bridge-contract.json`
- `deploy/terraform/modules/gcp-ml-bridge/`
- `platform/tools/eval-pipeline/`

**gtcx-intelligence must implement:** `mlops-as-a-service` spec, runbook, `pnpm mlops:check`, witness per `bridge-os/pm/spec/ops-lanes-100-plan.json`.
