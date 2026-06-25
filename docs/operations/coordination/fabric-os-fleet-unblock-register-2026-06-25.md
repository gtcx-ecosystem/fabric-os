---
title: 'fabric-os fleet unblock register'
status: current
date: 2026-06-25
owner: fabric-os
document_type: backlog
tier: critical
tags: ['coordination', 'compliance', 'infra', 'unblock']
document_id: FABRIC-UNBLOCK-REG-001
---

# fabric-os fleet unblock register

Master inventory of work where fabric-os is the owning blocker for sibling-repo progress. Used to sequence repo-by-repo unblocks and to feed the proactive non-blocking CI spec.

## Active fabric-os-owned blockers

| ID     | Blocked repo  | Blocked work                 | Fabric-os deliverable                                     | Type       | Class | Priority | Lift   | Status |
| ------ | ------------- | ---------------------------- | --------------------------------------------------------- | ---------- | ----- | -------- | ------ | ------ |
| FB-001 | markets-os    | IR-006 / PROD-READY-005      | Staging API credential chain + reachable advisory-api     | infra      | A     | P0       | medium | open   |
| FB-002 | griot-ai      | STORY-GRIOT-HTTPS-001        | ACM cert + HTTPS listener for api.griot.ai                | infra      | A     | P0       | medium | open   |
| FB-003 | griot-ai      | STORY-GRIOT-LIVE-STAGING-001 | Live staging substrate witness                            | infra      | A     | P1       | medium | open   |
| FB-004 | terminal-os   | MPR compliance unlock        | P35 layout strict GREEN, ops:check green, agentic harness | compliance | R     | P1       | small  | open   |
| FB-005 | bridge-os     | MPR compliance unlock        | P35 layout strict GREEN, ops:check green, agentic harness | compliance | R     | P1       | small  | open   |
| FB-006 | agile-os      | MPR compliance unlock        | P35 layout strict GREEN, ops:check green, agentic harness | compliance | R     | P2       | small  | open   |
| FB-007 | canon-os      | MPR compliance unlock        | P35 layout strict GREEN, ops:check green, agentic harness | compliance | R     | P2       | small  | open   |
| FB-008 | ecosystem-os  | MPR compliance unlock        | P35 layout strict GREEN, ops:check green, agentic harness | compliance | R     | P2       | small  | open   |
| FB-009 | veritas-ai    | MPR compliance unlock        | P35 layout strict GREEN, ops:check green, agentic harness | compliance | R     | P2       | small  | open   |
| FB-010 | venture-os    | MPR compliance unlock        | P35 layout strict GREEN, ops:check green, agentic harness | compliance | R     | P2       | small  | open   |
| FB-011 | nyota-ai      | MPR compliance unlock        | P35 layout strict GREEN, ops:check green, agentic harness | compliance | R     | P2       | small  | open   |
| FB-012 | ledger-os     | Foundation rebuild           | Docs SoR, pm folder, real product packs (full=1)          | content    | R     | P2       | large  | open   |
| FB-013 | inspection-os | Foundation rebuild           | Docs SoR, pm folder, real product packs (full=1)          | content    | R     | P2       | large  | open   |

## Sequenced execution plan

1. **Wave 1 — high-ROI compliance unlock (Class R)**
   - terminal-os → bridge-os → fabric-os/ledger-ui (verify already 100) → gtcx-markets/markets-os/compliance-os/gtcx-os/terra-os/exploration-os/sensei-os (already full-unlock, verify)
   - Then fan to the 84-cluster and mid-tier as time allows.

2. **Wave 2 — live infra credentials (Class A)**
   - FB-001 markets-os staging API chain
   - FB-002 griot-ai ACM HTTPS
   - These require operator authorization for live credentials/certificates.

3. **Wave 3 — structural rebuild (multi-session)**
   - FB-012 ledger-os
   - FB-013 inspection-os

## Proactive CI spec

See [`fabric-os-proactive-nonblocking-ci-spec-2026-06-25.md`](./fabric-os-proactive-nonblocking-ci-spec-2026-06-25.md).

## Retrospective

See [`fabric-os-blocking-retrospective-2026-06-25.md`](./fabric-os-blocking-retrospective-2026-06-25.md).
