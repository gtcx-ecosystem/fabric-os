---
title: ACK — vendor assurance Status Update routing (fabric-os owner)
status: current
date: 2026-06-13
owner: fabric-os
inboundFrom: bridge-os
ticket: XR-BRIDGE-VENDOR-ROUTING-001
---

# ACK — fabric-os owns vendor gate Status Update sections

Bridge flag **XR-BRIDGE-VENDOR-ROUTING-001** accepted.

**fabric-os** is the sole owner repo that may list `BG-10-10`, `BG-10-11`, and `EXT-INF-013` in agent Status Updates — under `### Parallel sovereign gates` with `blocksIR: false` and **Does not block:** `SECAS-S2-01`. Never under `### Approval needed`.

Sibling repos (bridge-os, agile-os, canon-os, gtcx-os) **omit** these gates entirely; they witness via `fleetOwnerRedirect` and `bridge-os/pm/ci/secas-witness-rollup-latest.json`.

Normative: `bridge-os/pm/spec/vendor-assurance-status-update-routing.json`
