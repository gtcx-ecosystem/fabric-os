---
title: 'Inbound — MLOps lane (baseline-os owner)'
status: current
date: 2026-06-15
owner: fabric-os
document_type: coordination
---

# Inbound — MLOps lane operationalization

**From:** `fabric-os` · **Branch:** `feature/ai-mlops`  
**To:** `baseline-os` (MLOps owner — AI OS lane)

## Owner contract

MLOps runs through **baseline-os** (cost-router, model eval governance, AI runtime) and **bridge-os** (fleet program office / witnesses). **Not** `gtcx-os` or legacy `gtcx-intelligence`.

## fabric-os substrate (this branch)

- `pm/spec/mlops-bridge-contract.json`
- `deploy/terraform/modules/gcp-ml-bridge/`
- `platform/tools/eval-pipeline/`

## baseline-os deliverables

1. `pm/spec/mlops-as-a-service.json`
2. `docs/operations/mlops-as-a-service.md`
3. `platform/scripts/mlops-check.mjs` + tests
4. `audit/evidence/mlops-check-latest.json`
5. Wire to existing `docs/specs/runtime/cost-router.md`

## Harness target

```bash
pnpm mlops:check:write   # baseline-os (to implement)
pnpm --dir ../bridge-os ecosystem:aiops:check:fleet:write
```
