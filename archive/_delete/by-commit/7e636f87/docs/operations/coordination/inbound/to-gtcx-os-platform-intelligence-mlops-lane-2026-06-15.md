---
title: 'Inbound — MLOps lane (gtcx-os/platform/intelligence owner)'
status: current
date: 2026-06-15
owner: fabric-os
document_type: coordination
---

# Inbound — MLOps lane operationalization

**From:** `fabric-os` · **Branch:** `feature/ai-mlops`  
**To:** `gtcx-os/platform/intelligence` (MLOps owner — migrated from legacy `gtcx-intelligence` repo ID)

fabric-os ships substrate on this branch:

- `pm/spec/mlops-bridge-contract.json`
- `deploy/terraform/modules/gcp-ml-bridge/`
- `platform/tools/eval-pipeline/`

**Owner repo must implement** under `gtcx-os/platform/intelligence/`:

- `mlops-as-a-service` spec, runbook, `pnpm mlops:check`, witness per `bridge-os/pm/spec/ops-lanes-100-plan.json`

**Verification path:** `../gtcx-os/platform/intelligence/AGENTS.md` · local checkout `gtcx-os/platform/intelligence/`
