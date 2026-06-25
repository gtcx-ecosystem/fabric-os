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

| ID        | Blocked repo  | Blocked work                 | Fabric-os deliverable                                            | Type       | Class | Priority | Status                   |
| --------- | ------------- | ---------------------------- | ---------------------------------------------------------------- | ---------- | ----- | -------- | ------------------------ |
| F-prod-06 | griot-ai      | STORY-GRIOT-HTTPS-001        | api.griot.ai production HTTPS ACM cert + ALB listener            | infra      | A     | P0       | awaiting_operator_action |
| FB-001    | markets-os    | IR-006                       | markets-os staging API credential chain + reachable advisory-api | infra      | A     | P0       | awaiting_operator_action |
| FB-002    | griot-ai      | STORY-GRIOT-HTTPS-001        | ACM cert + HTTPS listener for griot-staging.gtcx.trade           | infra      | A     | P0       | awaiting_operator_action |
| FB-003    | griot-ai      | STORY-GRIOT-LIVE-STAGING-001 | Live staging substrate witness                                   | infra      | A     | P1       | open                     |
| FB-004    | terminal-os   | MPR compliance unlock        | terminal-os MPR compliance unlock                                | compliance | R     | P1       | done                     |
| FB-005    | bridge-os     | MPR compliance unlock        | bridge-os MPR compliance unlock                                  | compliance | R     | P1       | done                     |
| FB-006    | agile-os      | MPR compliance unlock        | agile-os MPR compliance unlock                                   | compliance | R     | P2       | open                     |
| FB-007    | canon-os      | MPR compliance unlock        | canon-os MPR compliance unlock                                   | compliance | R     | P2       | open                     |
| FB-008    | ecosystem-os  | MPR compliance unlock        | ecosystem-os MPR compliance unlock                               | compliance | R     | P2       | open                     |
| FB-009    | veritas-ai    | MPR compliance unlock        | veritas-ai MPR compliance unlock                                 | compliance | R     | P2       | open                     |
| FB-010    | venture-os    | MPR compliance unlock        | venture-os MPR compliance unlock                                 | compliance | R     | P2       | open                     |
| FB-011    | nyota-ai      | MPR compliance unlock        | nyota-ai MPR compliance unlock                                   | compliance | R     | P2       | open                     |
| FB-012    | ledger-os     | Foundation rebuild           | ledger-os foundation rebuild                                     | content    | R     | P2       | open                     |
| FB-013    | inspection-os | Foundation rebuild           | inspection-os foundation rebuild                                 | content    | R     | P2       | open                     |

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
