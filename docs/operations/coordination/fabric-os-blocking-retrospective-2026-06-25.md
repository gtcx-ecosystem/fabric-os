---
title: 'fabric-os blocking retrospective'
status: draft
date: 2026-06-25
owner: fabric-os
document_type: retrospective
tier: operating
tags: ['retrospective', 'blocking', 'compliance', 'infra']
document_id: FABRIC-BLOCK-RETRO-001
review_cycle: on-change
---

# fabric-os blocking retrospective

Date: 2026-06-25
Scope: incidents where fabric-os blocked sibling-repo engineering or GTM progress

## What happened

1. **markets-os IR-006 / PROD-READY-005** — fabric-os staging API credential chain unreachable, blocking A1 promotion.
2. **griot-ai HTTPS + live staging** — fabric-os ACM/cert and substrate delivery not ready when griot-ai needed it.
3. **Fleet compliance unlock** — 17 repos scored compliance 69 PROV because shared P35/ops/agentic harness checks were not green proactively. Many were actually full-unlock once re-audited cleanly, but batch runs masked this.
4. **fabric:assurance:run:write batch contention** — tight batch loop caused spurious probe failures, making the fleet look sicker than it was.

## Root causes

| Cause                                        | Evidence                                              | Fix                                                      |
| -------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Reactive, not proactive                      | Blockers discovered when consumer repos ran preflight | Fleet health CI every 4h                                 |
| No substrate SLO                             | Staging API health not witnessed daily                | `staging-health-latest.json` + 4h fix SLO                |
| Shared compliance harness opaque             | 17 repos at identical 69 with no per-repo diagnosis   | `fabric:fleet:health:check` with per-repo violation list |
| Batch audit unreliable                       | 21-repo tight loop caused false probe FAILs           | Sequential audits + verification                         |
| Class A/S gates mixed into engineering queue | SECAS/legal appeared as blockers                      | Parallel lane isolation in P22                           |

## What worked

- Clean sequential re-audit established real scores quickly.
- baseline-os P35 fix lifted compliance 96→99 and unlocked 100/100.
- Cross-repo agent log captured blockers durably.

## Action items

1. Implement [`fabric-os-proactive-nonblocking-ci-spec-2026-06-25.md`](./fabric-os-proactive-nonblocking-ci-spec-2026-06-25.md).
2. Finish Wave 1 compliance unlock: terminal-os, bridge-os, then verify already-green repos.
3. Resolve FB-001 and FB-002 after operator authorization.
4. Add fleet health check to fabric-os CI before next sprint close.

## Lessons

- A fleet is only as unblocked as its healthiest shared gate.
- Batch probes must be verified; false lows waste remediation effort.
- fabric-os must publish daily substrate health witnesses, not wait to be asked.
