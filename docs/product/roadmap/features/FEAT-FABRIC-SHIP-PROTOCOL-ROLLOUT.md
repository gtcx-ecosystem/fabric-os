---
featureId: FEAT-FABRIC-SHIP-PROTOCOL-ROLLOUT
status: current
title: 'FEAT-FABRIC-SHIP-PROTOCOL-ROLLOUT — final release-management gate'
owner: fabric-os
document_type: feature-spec
tier: product
authority: GTCX-SHIP-001
date: 2026-07-01
tags: [fabric-os, ship, dslc, release-management]
review_cycle: on-change
---

# Fabric SHIP Protocol Rollout

## Intent

Create the final post-DSLC release-management gate for GTCX v1 releases:
**Sealed, Hardened, Institutionalized, and Provisioned**.

SHIP closes the gap between “DSLC passed” and “this is formally shippable as an
institutional GTCX v1 product/release.” It binds release proof, hardening,
institutional product standards, and versioned/public documentation into one
machine-evaluable protocol.

## Scope

| Work item | Outcome                                                 | Gate                       |
| --------- | ------------------------------------------------------- | -------------------------- |
| SHIP-001  | Canonical contract, schema, evaluator, and tests        | `pnpm ship:test`           |
| SHIP-002  | Protocol runbook and release-management command surface | `pnpm ship:contract:check` |
| SHIP-003  | Owner-ring internal release manifest after DSLC         | `pnpm ship:release`        |
| SHIP-004  | Evidence/report writer for release closeout             | `pnpm ship:release:write`  |

## Acceptance

- SHIP has a versioned human and machine contract.
- SHIP explicitly consumes DSLC and does not duplicate DSLC/QASC scoring.
- SHIP covers the four pillars:
  - Sealed
  - Hardened
  - Institutionalized
  - Provisioned
- SHIP records Class S approvals as evidence and does not synthesize them.
- SHIP emits machine-readable release evidence and a dated release report.

## Out of scope

- Making legal determinations.
- Issuing public claims.
- Approving billing, pricing, or revenue recognition.
- Publishing GitBook content from this repo unless the release class activates
  that control and the authorized docs owner provides evidence.
