---
title: 'Seal — S39-01 staging warm + AGX diagnosis (XR-MKT-011)'
status: delivered-partial
date: 2026-06-10
from: gtcx-infrastructure
to: gtcx-markets
ticket: XR-MKT-011
protocol: P24 + P40
priority: P0
blocksIR: false
---

# Infra seal (partial): staging warmed; AGX image still blocks pilot

## Actions executed (Class A approval 2026-06-10)

| Step         | Command                                         | Result                                                            |
| ------------ | ----------------------------------------------- | ----------------------------------------------------------------- |
| Warm staging | `pnpm env:warm --env staging` (bridge-os)       | exit **0** — RDS start + EKS `gtcx-staging-nodes` desired **0→2** |
| Node join    | `kubectl get nodes`                             | **2** Ready (`v1.31.14-eks`)                                      |
| Health probe | `GET https://api.staging.gtcx.trade/api/health` | **503** (was **504** cold)                                        |

## Root cause (updated)

1. **Cold cluster** — staging scaled to **0 nodes**; `env:warm` required before any smoke (P40 warm stage).
2. **AGX CrashLoopBackOff** — `gtcx-agx-staging` logs: `Cannot find module '@gtcx/platform-shared'` in image `gtcx-agx:staging`.
3. **Ingress gap** — authority URLs at `/{orders,escrow-deposit,...}` still route to protocols catch-all when AGX healthy; ALB paths must be added per handoff.

## Owner split (remaining)

| Owner                        | Action                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| **gtcx-platforms** (gtcx-os) | `pnpm docker:push:agx:staging` — image must bundle `@gtcx/platform-shared`                 |
| **gtcx-infrastructure**      | Rollout new digest; add XR-MKT-011 ingress paths → `gtcx-agx-staging` before `/` catch-all |
| **gtcx-markets**             | Re-run `pnpm authority:trace:capture` after health **200** + ingress seal **delivered**    |

## Acceptance (not yet met)

| Gate                      | Current                                                                     |
| ------------------------- | --------------------------------------------------------------------------- |
| `api/health`              | **503**                                                                     |
| `authority:trace:capture` | not re-run — AGX unhealthy                                                  |
| Ingress matrix            | **applied** 2026-06-10 — 7 paths → `gtcx-agx-staging`; matrix doc published |

## Ingress witness (2026-06-10)

- `kubectl apply -f deploy/kubernetes/overlays/staging/ingress.yaml` → exit **0**
- Matrix: `docs/operations/coordination/xr-mkt-011-authority-url-matrix-2026-06-10.md`
- Probe: `POST /orders` → **403** (reachable via ALB; auth/backend pending healthy AGX)

## Markets re-run

```bash
export $(grep -E '^BASELINE_MASTER_KEY=' ~/.baseline/env | xargs)
cd gtcx-markets && pnpm staging:env:materialize && pnpm authority:trace:capture
```

## Witness

- `bridge-os/pm/ci/env-transition-latest.json` — env:warm 2026-06-10
- `gtcx-markets/docs/operations/evidence/class-s-execution-attempt-2026-06-10.json` — post-approval probes
