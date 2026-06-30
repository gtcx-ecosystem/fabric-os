---
storyId: MATURITY-LANE-FAB-002
initiativeId: INIT-XR-FLEET-MATURITY-LANES
featureId: FEAT-FABRIC-ASSURANCE-WITNESS-LANE
title: 'Scrub SECAS/Legal/SOC2 witnesses — uniform externalAssurance schema'
status: done
priority: P0
owner: fabric-os
lane: externalAssurance
blocksEngineering: false
date: 2026-06-24
document_type: prd
tier: product
tags: [fabric-os, roadmap]
review_cycle: on-change
---

# MATURITY-LANE-FAB-002 — Assurance witness schema scrub

## Value

Every fabric assurance witness explicitly states it does not block engineering maturity or integrator-pilot GTM — fleet dashboards stop misreading vendor calendar as "product not built."

## Acceptance

- [ ] Shared schema: `pm/spec/assurance-lane-witness-fields.json` (agile-os requirement B)
- [ ] All targets under witness glob updated (see `FEAT-FABRIC-ASSURANCE-WITNESS-LANE`)
- [ ] `secas-pentest-ingest-check`, `secas-pentest-remediation-check`, legal friction witnesses include lane fields
- [ ] `m3-external-certification-latest.json` aligned with baseline-os inbound pattern (`blocksAnyRepo: false` retained)
- [ ] `pnpm maturity-lane:check:write` PASS after scrub
- [ ] `pnpm secas:*:check:write` still PASS (no behavioral regression on internal closure)

## Required fields (assurance witnesses)

```json
{
  "lane": "externalAssurance",
  "blocksEngineeringMaturity": false,
  "blocksIntegratorPilotGtm": false,
  "blocksGtmStage": false,
  "blocksIR": false,
  "blocksAnyRepo": false,
  "procurementSegment": "enterpriseUsEu"
}
```

## Owner repos implicated (reference only)

compliance-os witnesses cited by fabric rollup — fabric updates **fabric-os paths** only; P24 ticket to compliance-os if their witnesses are fleet-read.
