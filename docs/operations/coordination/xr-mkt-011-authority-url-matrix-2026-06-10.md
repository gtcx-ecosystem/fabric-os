---
title: 'XR-MKT-011 authority URL matrix (staging)'
status: current
date: 2026-06-10
owner: gtcx-infrastructure
ticket: XR-MKT-011
protocol: P24 + P41
---

# XR-MKT-011 — canonical staging authority URL matrix

## Base host

`https://api.staging.gtcx.trade`

## Operations (7)

| Operation                    | Env var                                             | Path              | Method | Auth                                                    |
| ---------------------------- | --------------------------------------------------- | ----------------- | ------ | ------------------------------------------------------- |
| `orders.evaluate`            | `GTX_MARKETS_ORDER_AUTHORITY_URL`                   | `/orders`         | POST   | `Authorization: Bearer <GTX_MARKETS_AUTHORITY_API_KEY>` |
| `escrow.deposit`             | `GTX_MARKETS_ESCROW_DEPOSIT_AUTHORITY_URL`          | `/escrow-deposit` | POST   | Bearer                                                  |
| `escrow.release`             | `GTX_MARKETS_ESCROW_RELEASE_AUTHORITY_URL`          | `/escrow-release` | POST   | Bearer                                                  |
| `settlements.initiate`       | `GTX_MARKETS_SETTLEMENT_INITIATION_AUTHORITY_URL`   | `/settle-init`    | POST   | Bearer                                                  |
| `settlements.finalize`       | `GTX_MARKETS_SETTLEMENT_FINALIZATION_AUTHORITY_URL` | `/settle-final`   | POST   | Bearer                                                  |
| `funds.capital_call_issue`   | `GTX_MARKETS_CAPITAL_CALL_ISSUANCE_AUTHORITY_URL`   | `/cc-issue`       | POST   | Bearer                                                  |
| `funds.capital_call_payment` | `GTX_MARKETS_CAPITAL_CALL_PAYMENT_AUTHORITY_URL`    | `/cc-pay`         | POST   | Bearer                                                  |

## Ingress

All paths route to `gtcx-agx-staging:3000` in
`deploy/kubernetes/overlays/staging/ingress.yaml` (before `/` protocols catch-all).

## Acceptance

| Gate            | Target                                                              |
| --------------- | ------------------------------------------------------------------- |
| AGX health      | `GET /api/health` → **200**                                         |
| Authority trace | `pnpm authority:trace:capture` (gtcx-markets) → **7/7**, exit **0** |
| Fleet probe     | `pnpm daas:fleet:health` → agx-api **PASS**                         |

## Witness

- Markets contract: `gtcx-markets/platform/contracts/ecosystem/authority-staging-env-manifest.json`
- Infra seal: `docs/operations/coordination/from-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md`
