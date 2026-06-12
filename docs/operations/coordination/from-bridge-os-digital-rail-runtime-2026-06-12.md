---
title: 'Ack — Digital rail runtime (bridge-os → fabric-os)'
status: done
date: 2026-06-12
owner: fabric-os
from: bridge-os
to: fabric-os
ticket: XR-FABRIC-RAIL-003
initiative: INIT-DIGITAL-RAIL-WAVE-0
parent: XR-BRIDGE-CONT-CAPITAL-001
program: PROG-DIGITAL-RAIL-WAVE-0
protocol: P24
priority: P0
authorityClass: R
blocksIR: false
responds_to: bridge-os/docs/operations/coordination/to-fabric-os-digital-rail-runtime-2026-06-12.md
---

# Ack — Digital rail Wave 0 runtime programme

## Summary

Fabric-os accepts **XR-FABRIC-RAIL-003** from bridge-os continental capital programme intake. Wave 0 registers **multi-rail runtime orchestration** alongside `PROG-TOKENIZATION-001` — Besu/permissioned-EVM staging path, Stellar corridor ops template (profile-gated), key custody + DR patterns, and staging deploy witnesses per rail id.

**Policy:** Register-first default. Adapter runtime only — Stellar/Canton are not platform replacement. Coordinate with gtcx-os `@gtcx/digital-rail` + `@gtcx/protocol-pvp` close path before production apply.

## Evidence

| Artifact                    | Path                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Bridge outbound             | `bridge-os/docs/operations/coordination/to-fabric-os-digital-rail-runtime-2026-06-12.md`    |
| Rail policy SoR             | `markets-os/platform/contracts/ecosystem/digital-rail-policy.json`                          |
| gtcx-os adapter + PvP close | `gtcx-os@643a342f` — `XR-GTCX-DIGITAL-RAIL-001`, `XR-GTCX-PVP-RAIL-002`                     |
| Execution plan              | `docs/operations/coordination/xr-bridge-rail-003-digital-rail-execution-plan-2026-06-12.md` |
| Programme manifest          | `pm/digital-rail-programme.json`                                                            |
| Staging witness             | `audit/evidence/digital-rail-staging-witness-latest.json`                                   |

## Wave 0 deliverables (fabric-os)

| ID     | Deliverable                              | Status                                      |
| ------ | ---------------------------------------- | ------------------------------------------- |
| FR-001 | Programme row `PROG-DIGITAL-RAIL-WAVE-0` | **done**                                    |
| FR-002 | Besu / permissioned-EVM staging path     | **scaffold** — staging env patch            |
| FR-003 | Stellar anchor/corridor ops template     | **template** — profile-gated, not default   |
| FR-004 | Key custody + DR for rail nodes          | **planned** — SECaaS patterns               |
| FR-005 | Multi-rail deploy witness                | **scaffold** — witness JSON + staging patch |

## Class S (operator — parallel, blocksIR false)

- Stellar SDF partner thread
- Production rail credentials and sovereign node politics

## Verification

```bash
cd fabric-os
test -f pm/digital-rail-programme.json
test -f audit/evidence/digital-rail-staging-witness-latest.json
```
