---
title: 'Outbound — veritas-ai QASC/DSLC/SHIP parity remediation'
status: current
date: 2026-07-01
from: fabric-os
to: veritas-ai
story: FABRIC-QASC-DSLC-SHIP-FLEET-PARITY-001
authorityClass: R
protocol: P24
owner: veritas-ai
document_type: coordination-handoff
tier: operating
tags: [fabric-os, veritas-ai, qasc, dslc, ship, fleet-parity, remediation]
review_cycle: on-change
---

# Outbound — veritas-ai QASC/DSLC/SHIP parity remediation

Fabric's canonical parity witness classifies `veritas-ai` as `gap`.

## Missing local parity surface

- Scripts: qasc:check, dslc:check, ship:check
- Specs: machine/spec/qasc-protocol.json, machine/spec/dslc-protocol.json, machine/spec/release-readiness-benchmark.json
- Witnesses: machine/ci/qasc-protocol-latest.json, machine/ci/dslc-protocol-latest.json
- SHIP witness any-of: missing

## Delegated route gap

- Delegation pins present: machine/spec/aaas-audit-contract.pin.json
- Delegated protocols still missing script+witness: qasc, dslc, ship

## Required remediation

- Local route: add repo-local `qasc:check`, `dslc:check`, and `ship:check` scripts with specs and latest witnesses.
- Delegated route: add explicit Fabric delegation pins plus current delegated QASC/DSLC/SHIP witnesses.
- Exempt route: request a Fabric contract exemption with reason, owner, review date, and impact.

Canonical Fabric witness: `audit/evidence/qasc-dslc-ship-fleet-parity-latest.json`.
Current strict parity: 2/21 repos at parity; 19 gaps.
