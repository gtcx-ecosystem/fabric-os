---
title: 'Outbound — fleet QASC/DSLC/SHIP parity remediation'
status: current
date: 2026-07-01
from: fabric-os
to: fleet-repo-owners
story: FABRIC-QASC-DSLC-SHIP-FLEET-PARITY-001
authorityClass: R
protocol: P24
owner: fabric-os
document_type: coordination-handoff
tier: operating
tags: [fabric-os, aaas, qasc, dslc, ship, fleet-parity, remediation]
review_cycle: on-change
---

# To fleet repo owners — QASC/DSLC/SHIP parity remediation

## Context

Fabric now owns the fleet parity witness for the QASC, DSLC, and SHIP protocol
model. The witness distinguishes:

- `local-complete` — repo-local QASC, DSLC, and SHIP scripts, specs, and latest
  witnesses exist.
- `fabric-provider` — Fabric central provider surface exists.
- `delegated` — repo has a complete pinned Fabric delegation plus current
  delegated QASC/DSLC/SHIP witnesses.
- `exempt` — repo is explicitly exempt by Fabric contract.
- `gap` — no valid local, delegated, provider, or exempt status.

Machine witness:
`fabric-os/audit/evidence/qasc-dslc-ship-fleet-parity-latest.json`

Report:
`fabric-os/audit/reports/qasc-dslc-ship-fleet-parity-2026-07-01.md`

## Current fleet result

| Classification    | Count |
| ----------------- | ----: |
| `local-complete`  |     1 |
| `fabric-provider` |     1 |
| `delegated`       |     8 |
| `exempt`          |     0 |
| `gap`             |    11 |

Known complete/provider repos:

- `gtcx-os` — `local-complete`
- `fabric-os` — `fabric-provider`
- `baseline-os` — `delegated`
- `compliance-os` — `delegated`
- `document-os` — `delegated`
- `exploration-os` — `delegated`
- `ledger-ui` — `delegated`
- `markets-os` — `delegated`
- `sensei-os` — `delegated`
- `venture-os` — `delegated`

## Required remediation path

Each gap repo must choose one valid path and then regenerate the Fabric witness.

### Path A — repo-local parity

Add local protocol ownership:

- package scripts:
  - `qasc:check`
  - `qasc:check:write`
  - `dslc:check`
  - `dslc:check:write`
  - `ship:check`
- specs:
  - `machine/spec/qasc-protocol.json`
  - `machine/spec/dslc-protocol.json`
  - `machine/spec/release-readiness-benchmark.json`
- witnesses:
  - `machine/ci/qasc-protocol-latest.json`
  - `machine/ci/dslc-protocol-latest.json`
  - one current SHIP/release witness such as
    `audit/evidence/ship-latest.json` or `machine/ci/release-readiness-latest.json`

Use `gtcx-os` as the current local reference implementation.

### Path B — full Fabric delegation

Pin the Fabric contract and produce delegated witnesses for all three protocols:

- pin at least one explicit Fabric contract reference:
  - `machine/spec/aaas-audit-contract.pin.json`
  - `machine/spec/qasc-contract.pin.json`
  - `machine/spec/dslc-contract.pin.json`
  - `machine/spec/ship-contract.pin.json`
  - `pm/spec/aaas-audit-contract.pin.json` for repos whose canonical
    machine-readable product plane is `pm/`
- provide QASC script + witness
- provide DSLC script + witness
- provide SHIP script + witness

Partial QASC-only delegation is not sufficient for QASC/DSLC/SHIP parity.

## Gap repo matrix

| Repo            | Current state            | Required next action                                                                                        |
| --------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `agile-os`      | gap                      | Add local triplet or full Fabric delegation.                                                                |
| `bridge-os`     | gap                      | Add local triplet or full Fabric delegation; keep Bridge as reference/runtime metadata, not protocol owner. |
| `canon-os`      | gap                      | Add local triplet or full Fabric delegation.                                                                |
| `ecosystem-os`  | gap                      | Add local triplet or full Fabric delegation.                                                                |
| `griot-ai`      | gap                      | Add local triplet or full Fabric delegation.                                                                |
| `inspection-os` | partial QASC signal only | Add DSLC + SHIP and formal delegation pins, or adopt local triplet.                                         |
| `ledger-os`     | gap                      | Add local triplet or full Fabric delegation.                                                                |
| `nyota-ai`      | gap                      | Add local triplet or full Fabric delegation.                                                                |
| `terminal-os`   | partial QASC signal only | Add DSLC + SHIP and formal delegation pins, or adopt local triplet.                                         |
| `terra-os`      | gap                      | Add local triplet or full Fabric delegation.                                                                |
| `veritas-ai`    | gap                      | Add local triplet or full Fabric delegation.                                                                |

## Verification

Run from `fabric-os` after any repo remediates:

```bash
pnpm qasc:dslc:ship:fleet-parity:write
pnpm qasc:dslc:ship:fleet-parity:strict -- --repos <repo>
```

Fleet strict is expected to remain nonzero until all 11 gap repos are
remediated or explicitly exempted by Fabric contract.

## Boundary

This handoff does not move AaaS, QASC, DSLC, or SHIP ownership to `bridge-os`.
Bridge may remain a scoring/runtime/reference dependency, but Fabric owns the
fleet protocol contract and witness.
