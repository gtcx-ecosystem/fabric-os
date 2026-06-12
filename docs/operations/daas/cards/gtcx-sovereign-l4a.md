---
title: DaaS card — GTCX Sovereign (L4a bundle)
status: current
date: 2026-06-12
laneId: L4a
deployProduct: GTCX Sovereign
friction: XR-301
owner: fabric-os
productOwner: gtcx-os
protocol: P41-DEVOPS-AS-A-SERVICE
---

# DaaS card: GTCX Sovereign (L4a — ADR-007)

## Profile

| Field             | Value                                                             |
| ----------------- | ----------------------------------------------------------------- |
| **laneId**        | **L4a** — civic / sovereign gov rails                             |
| **deployProduct** | **GTCX Sovereign** (CRX, SGX, Pathways, Operations — ADR-007)     |
| **Staging URL**   | `sovereign-staging.gtcx.trade`                                    |
| **Matrix ref**    | `INF-PER-REPO-001#gtcx-platforms` · XR-301                        |
| **Witness**       | `audit/evidence/xr-lane-witness-latest.json` (XR-301, laneId L4a) |

## Infra obligation (fabric-os)

1. ECR image rollout + sovereign ingress (TLS, WAF `/api/*`)
2. JWT / SM secrets for sovereign staging namespace
3. Pen-test scope **L4a only** — distinct from L4b AGX and T0 protocol API (`SEC-PENTEST-01` §2.1b)

## Seal witness

| Gate                                          | Result                                      |
| --------------------------------------------- | ------------------------------------------- |
| `GET sovereign-staging.gtcx.trade/api/health` | **200** (XR-301 done 2026-06-03)            |
| Lane witness                                  | `xr-lane-witness-latest.json` XR-301 `done` |

## Handoffs

- Rollout: `docs/operations/coordination/to-gtcx-platforms-rollout-ready-2026-06-03.md`
- Pen-test kickoff: `docs/operations/coordination/pen-test-kickoff-prep-2026-06-10.md` § L4a
