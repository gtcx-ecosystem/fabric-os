---
title: 'Outbound — ledger-ui QASC/DSLC/SHIP parity remediation'
status: resolved
date: 2026-07-01
from: fabric-os
to: ledger-ui
story: FABRIC-QASC-DSLC-SHIP-FLEET-PARITY-001
authorityClass: R
protocol: P24
owner: ledger-ui
document_type: coordination-handoff
tier: operating
tags: [fabric-os, ledger-ui, qasc, dslc, ship, fleet-parity, remediation]
review_cycle: on-change
---

# Outbound — ledger-ui QASC/DSLC/SHIP parity remediation

Resolved by `ledger-ui` commits `cb0039f8` and `021a0d36`:

- added delegated QASC, DSLC, and SHIP check scripts
- added internal DSLC and SHIP release manifests
- generated DSLC and SHIP witnesses at `ready · 100/100`
- refreshed QASC evidence and pushed `main`

Fabric's canonical parity witness now classifies `ledger-ui` as `delegated`.

## Missing local parity surface

- Scripts: none for delegated parity.
- Specs: local specs not required for delegated parity.
- Witnesses: delegated QASC, DSLC, and SHIP witnesses present.
- SHIP witness any-of: present.

## Delegated route gap

- Delegation pins present: machine/spec/aaas-audit-contract.pin.json
- Delegated protocols still missing script+witness: none

## Required remediation

No further remediation required for delegated parity.

Canonical Fabric witness: `audit/evidence/qasc-dslc-ship-fleet-parity-latest.json`.
Current strict parity: 6/21 repos at parity; 15 gaps.
