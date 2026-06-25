---
storyId: MATURITY-LANE-FAB-005
initiativeId: INIT-XR-FLEET-MATURITY-LANES
featureId: FEAT-FABRIC-CENTRAL-ASSURANCE-PROGRAM
title: 'Central assurance programme — absorb scattered repo assurance stories'
status: done
priority: P0
owner: fabric-os
lane: externalAssurance
blocksEngineering: false
blocksSprintSeal: false
date: 2026-06-24
---

# MATURITY-LANE-FAB-005 — Central assurance programme backlog

## Value

Product repos (terminal-os, markets-os, terra-os, …) ship engineering stories without pen-test/SOC2/LOI noise in P22 — fabric-os owns the parallel assurance calendar centrally.

## Acceptance

- [ ] `pm/spec/central-assurance-program.json` lists all programmes (SECAS, EXT-INF, SOC2) with `blocksEngineeringMaturity: false`
- [ ] `platform/scripts/central-assurance-check.mjs` audits:
  - fabric-os backlog contains assurance story IDs
  - product repos in fleet register have **zero** open stories matching `productRepoRules.forbiddenStoryPatterns`
- [ ] `pnpm central-assurance:check:write` → `audit/evidence/central-assurance-program-latest.json`
- [ ] Bridge inbound filed: request fleet diagnostic audit of product-repo assurance story pollution
- [ ] `docs/operations/secas/README.md` (or assurance hub doc) links central programme as operator entry
- [ ] P22 fabric-os head selects assurance stories only from central programme when assurance work is active

## agile-os handoff closure criterion #3

Central assurance backlog visible; product repos have zero pen-test/SOC2 **blocking** stories.

## Does not block

Engineering sprint seal in product repos (`blocksSprintSeal: false`).
