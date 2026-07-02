---
title: 'outbound — Markets brokerage staging deploy for Golden Transaction'
status: open
date: 2026-06-12
owner: markets-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
from: fabric-os
to: markets-os
ticket: XR-MKT-PROTOCOL-NATIVE-001
program: PROG-CAPITAL-FORMATION-001
protocol: P24
laneId: L4b
authorityClass: R
blocksIR: false
---

# outbound — Markets brokerage staging deploy for Golden Transaction

## Context

Fabric has completed PNV live deploy runway:

| Artifact                                              | Status                                   |
| ----------------------------------------------------- | ---------------------------------------- |
| `gtcx-protocols:e7525dfa` on `gtcx-protocols-staging` | **live**                                 |
| `/ready` fail-closed verifier                         | **200** `{"ready":true}`                 |
| `POST /v1/protocol-manifests/verify`                  | **409** live rejection on probe manifest |
| `gtx-markets/staging/protocols-verifier-url`          | synced                                   |
| `gtx-markets/staging/protocols-verifier-token`        | synced                                   |
| `gtcx-markets-manifest-signer-staging` secret         | exists in `gtcx-staging`                 |

Witness: `audit/evidence/protocol-verifier-staging-readiness-2026-06-12.json`

## Request (markets-os owner)

1. Deploy **brokerage-api** (or equivalent Markets trace route) to staging with ESO consuming:
   - `GTCX_OS_PROTOCOLS_VERIFIER_URL` ← `gtx-markets/staging/protocols-verifier-url`
   - `GTCX_OS_PROTOCOLS_VERIFIER_TOKEN` ← `gtx-markets/staging/protocols-verifier-token`
2. Run durable manifest + verification-trace migrations (per inbound §Fabric Execution Plan step 4).
3. Ack when `/internal/protocol-manifests/{listingId}/verification-traces` is reachable for Golden Transaction orchestration.

## Fabric will execute after ack

- `pnpm protocol:golden-transaction:probe:write` live trace pack
- Close residual gap in `docs/operations/coordination/outbound/to-markets-os-xr-mkt-protocol-native-ack-2026-06-12.md`

## Evidence links

- GT probe (partial): `audit/evidence/golden-transaction-protocol-native-2026-06-12.json`
- Deploy-ready: `audit/evidence/protocol-verifier-deploy-ready-2026-06-12.json`
- Inbound: `docs/operations/coordination/from-markets-os-protocol-native-runtime-2026-06-12.md`
