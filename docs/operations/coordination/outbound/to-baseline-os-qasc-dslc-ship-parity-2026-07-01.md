---
title: 'Outbound — baseline-os QASC/DSLC/SHIP parity remediation'
status: resolved
date: 2026-07-01
from: fabric-os
to: baseline-os
story: FABRIC-QASC-DSLC-SHIP-FLEET-PARITY-001
authorityClass: R
protocol: P24
owner: baseline-os
document_type: coordination-handoff
tier: operating
tags: [fabric-os, baseline-os, qasc, dslc, ship, fleet-parity, remediation]
review_cycle: on-change
---

# Outbound — baseline-os QASC/DSLC/SHIP parity remediation

Resolved by `baseline-os` commit `b3ffb00d7`:

- added `qasc:check` / `qasc:check:write`
- added `dslc:check` / `dslc:check:write`
- added `ship:check` / `ship:check:write`
- refreshed DSLC and SHIP release witnesses to `ready · 100/100`

Fabric's canonical parity witness now classifies `baseline-os` as `delegated`.

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
Current strict parity: 3/21 repos at parity; 18 gaps.
