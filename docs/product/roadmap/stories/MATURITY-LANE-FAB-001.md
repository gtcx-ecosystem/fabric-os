---
storyId: MATURITY-LANE-FAB-001
initiativeId: INIT-XR-FLEET-MATURITY-LANES
featureId: FEAT-FABRIC-MATURITY-LANE-ENFORCE
title: 'Pin GS-MATURITY-LANE-001 + maturity-lane:check harness'
status: done
priority: P0
owner: fabric-os
lane: engineeringMaturity
blocksEngineering: false
date: 2026-06-24
---

# MATURITY-LANE-FAB-001 — Pin policy + check harness

## Value

Operators and agents have a single fabric-os gate proving assurance artifacts declare lane separation — enforcement owner contract for the fleet.

## Acceptance

- [ ] `pm/spec/maturity-lane-separation.json` consumer pin → `../baseline-os/pm/spec/maturity-lane-separation.json` (or copy with `sor` href)
- [ ] `platform/scripts/maturity-lane-check.mjs` validates assurance witness glob for required fields:
  - `lane: externalAssurance` (or `engineeringMaturity` for non-assurance)
  - `blocksEngineeringMaturity: false`
  - `blocksIntegratorPilotGtm: false`
  - `blocksGtmStage: false`
- [ ] `pnpm maturity-lane:check` (dry) · `pnpm maturity-lane:check:write` (witness)
- [ ] Witness: `audit/evidence/maturity-lane-check-latest.json`
- [ ] Wired into `pnpm fabric:operations:check` or `pnpm operations:check`
- [ ] `package.json` scripts registered

## Implementation notes

| Artifact       | Path                                       |
| -------------- | ------------------------------------------ |
| Spec pin       | `pm/spec/maturity-lane-separation.json`    |
| Check script   | `platform/scripts/maturity-lane-check.mjs` |
| Witness schema | `gtcx://fabric-os/maturity-lane-check/v1`  |

## Audit notes

2026-06-24 — `pnpm maturity-lane:check:write` PASS · 7/7 assurance witnesses · witness `audit/evidence/maturity-lane-check-latest.json`
