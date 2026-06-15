---
title: 'Inbound — cost-router staging image rebuild (intelligence owner)'
status: current
date: 2026-06-15
owner: fabric-os
document_type: coordination
---

# Inbound — MOF-002 cost-router pod import

**From:** `fabric-os` · **To:** `gtcx-os/platform/intelligence`

## Probe result (2026-06-15)

| Check                                   | Result                                     |
| --------------------------------------- | ------------------------------------------ |
| `/health` `enableCostRouter`            | `true`                                     |
| Pod `require('baselineos/cost-router')` | **FAIL** — module missing in running image |

Running image tag: `gtcx-intelligence-sdk:12be534…` (see `deploy/kubernetes/overlays/staging/intelligence/deployment.yaml`).

Health flag is enabled via `ENABLE_COST_ROUTER=1` but the **image lacks baselineos** at runtime — routing falls back to env heuristics only.

## Intelligence deliverables

1. `node 03-platform/scripts/prepare-baseline-os-for-ci.mjs` — **PASS** locally
2. `node 03-platform/tools/verify-cost-router-v1.1-consume.mjs` — **PASS** locally
3. Rebuild + push SDK image with Dockerfile baselineos COPY layers (INT-S8-04 / INT-S13-01)
4. Notify fabric-os with new ECR digest for staging rollout

## fabric-os follow-up

After new digest: update deployment image → `kubectl apply -k deploy/kubernetes/overlays/staging/intelligence/` → `pnpm mlops:cost-router-staging-probe:write` must **PASS**.
