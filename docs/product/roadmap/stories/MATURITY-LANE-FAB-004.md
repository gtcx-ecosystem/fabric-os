---
storyId: MATURITY-LANE-FAB-004
initiativeId: INIT-XR-FLEET-MATURITY-LANES
featureId: FEAT-FABRIC-SESSION-ASSURANCE-LANE
title: 'fabric-os session — Parallel assurance lane presentation'
status: done
priority: P1
owner: fabric-os
lane: externalAssurance
blocksEngineering: false
date: 2026-06-24
---

# MATURITY-LANE-FAB-004 — fabric session assurance lane

## Value

fabric-os operators see assurance calendar under **Parallel assurance lane** — P22 Next work remains engineering/product unless an assurance story is explicitly head.

## Acceptance

- [x] `platform/scripts/agent-next-work.mjs` (or session render) emits:
  - `parallelAssuranceLane[]` for BG-10-_, EXT-INF-_, BL-SOC2-\*
  - `nextWorkItem` never an assurance item unless story `lane: externalAssurance` and owner fabric-os
- [x] `pnpm agent:next-work --json` includes `vendorAssuranceScope.approvalSection: omit` for product repos (already partial — extend to fabric presentation)
- [x] Status Update template: assurance under `### Parallel assurance lane`, not `### Approval needed`, when `blocksIR: false`
- [ ] Session witness `workstream/sessions/ci/session-ceremony-latest.json` records lane-separated sections

## Coordination

bridge-os `MATURITY-LANE-BRG-003` owns product-repo filter; this story owns fabric-os session ceremony.
