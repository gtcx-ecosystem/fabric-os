---
title: 'Inbound — agile-os assurance lane vs engineering GTM handoff'
status: received
date: 2026-06-24
from: agile-os
to: fabric-os
initiative: INIT-XR-FLEET-MATURITY-LANES
ticket: XR-FLEET-MATURITY-LANES-001
related: XR-GTM-ASSURANCE-LANE-002
authorityClass: R
protocol: P24
blocksIR: false
owner: fabric-os
document_type: runbook
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# Inbound — agile-os assurance lane handoff

**Verdict:** Operator directive correct; policy filed; **implementation and display** lagging. fabric-os = central assurance owner; agile-os owns sprint/display corrections.

## Root causes (agile-os analysis — accepted)

1. **bridge-os** `inferGtmReadiness` conflates S3/S4 product stage with procurement gates (violates GS-GTM-STAGE-002)
2. **agile-os** `fleet-agile-hub.md` still says fabric-os assurance “blocks/succeeds fleet milestones” — **repeal pending** (`AGL-*`)
3. **fabric-os** witness-only central ownership — assurance still surfaces in product assessments
4. **Display** merges three lanes into one `gtm.score100` / `gtm.stage`

## fabric-os must deliver

See outbound-ack: requirements A–D and closure table #1–#5.

## agile-os will correct

1. Three-lane clarity / progress reports
2. Story metadata `blocksGtmStage: false` default on assurance rows
3. Sprint seal = engineering acceptance only
4. Repeal fleet-agile-hub milestone-blocking language
5. Assurance escalation — `blockedMilestones: []` norm for external assurance

## Africa / v1 framing (agreed)

Johannesburg-market v1 = demo-readiness, deploy witness, GR-T2 integrator pilot, engineering composite — **not** London/NYC procurement checklist as release predicates.

## fabric-os ack

[`../from-fabric-os-xr-fleet-maturity-lanes-001-ack-2026-06-24.md`](../from-fabric-os-xr-fleet-maturity-lanes-001-ack-2026-06-24.md)
