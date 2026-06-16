---
title: 'Staging handoff to witness'
status: p0
date: 2026-06-12
owner: fabric-os
tier: operating
tags: ['protocol', 'documentation']
review_cycle: on-change
document_type: protocol
exrId: EXR-001
jtbdId: JTBD-staging-substrate-ready
flowId: flow-staging-handoff
personaId: sibling-integrator
---

# EXR-001 — Staging handoff to witness

## Intent

Sibling product repo receives staging substrate from gtcx-infrastructure with auditable completion seal.

## Acceptance (from JTBD)

- Inbound handoff acked
- Staging scripts/terraform/kubectl executed with exit codes
- Outbound seal with evidence link
- Product prereq check passable in owner repo

## UX refs

- Flow: `pm/ux/user-flows/flow-staging-handoff.md`
- PRD: `pm/product/prds/PRD-daass-operator-substrate.md`

## Engineering anchors

- `platform/scripts/staging/`
- `deploy/kubernetes/overlays/staging/`
- `docs/operations/agent-staging-execution.md`
