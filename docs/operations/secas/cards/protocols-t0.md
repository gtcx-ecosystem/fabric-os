---
title: SECaaS card — protocols (T0 industry rail)
status: current
date: 2026-06-12
owner: fabric-os
laneId: T0
deployProduct: protocol-rail
friction: SEC-PENTEST-01
---

# SECaaS card — protocols (T0)

**Lane:** **T0** · **deployProduct:** **protocol-rail** (TradePass / verification API — not UI)  
**Friction:** `SEC-PENTEST-01` · **DaaS overlap:** XR-101

## Stack security actions (fabric-os)

1. Staging protocols API + admin paths in pen-test scope **T0** bucket only
2. WAF / ingress rules per `audit/pen-test-scope-2026.md` §2.1b
3. Distinct from **L4a** sovereign (`sovereign-staging.gtcx.trade`) and **L4b** AGX (`api.staging.gtcx.trade`)

## Seal witness

| Gate                        | Result                                                           |
| --------------------------- | ---------------------------------------------------------------- |
| XR-101 staging operator DID | `GET /v1/tradepass/did:gtcx:tp_staging_e2e_001` → **200**        |
| Lane witness                | `audit/evidence/xr-lane-witness-latest.json` XR-101 `laneId: T0` |

## Re-probe

`pnpm secas:pentest:ingest:check` — pre-window PASS; report ingest after 2026-06-17..21.
