---
storyId: MATURITY-LANE-FAB-003
initiativeId: INIT-XR-FLEET-MATURITY-LANES
featureId: FEAT-FABRIC-HEALTH-PROBE-LANE
title: 'cross-repo-health-probe — exclude vendor calendar from product FAIL'
status: done
priority: P0
owner: fabric-os
lane: engineeringMaturity
blocksEngineering: false
date: 2026-06-24
---

# MATURITY-LANE-FAB-003 — Fleet health probe lane separation

## Value

Product repos pass fleet health when **engineering endpoints** are healthy — not when vendor pen-test ingest calendar is open.

## Acceptance

- [ ] `platform/tools/scripts/cross-repo-health-probe.mjs` classifies checks:
  - `engineeringHealth` — HTTP/gate probes → affects repo `ok`
  - `assuranceCalendar` — SECAS vendor window, SOC2 pending → `parallelAssurance` array only
- [ ] Product repo rollup `ok: true` when engineering checks pass and assurance calendar open
- [ ] Witness `audit/evidence/daas-fleet-health-latest.json` includes `laneSeparation: GS-MATURITY-LANE-001`
- [ ] `pnpm daas:fleet:health --write` PASS for terminal-os / compliance-os with open vendor calendar
- [ ] Documented in `docs/operations/devops-as-a-service.md`

## Forbidden

- FAIL product repo because `secas-pentest-ingest` phase is `awaiting_vendor_report`
- FAIL product repo because `human-gates.manifest` has open Class S rows with `blocksIR: false`
