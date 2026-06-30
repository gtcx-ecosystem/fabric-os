---
featureId: FEAT-FABRIC-ASSURANCE-WITNESS-LANE
initiativeId: INIT-XR-FLEET-MATURITY-LANES
title: 'FEAT-FABRIC-ASSURANCE-WITNESS-LANE — SECAS/Legal/SOC2 witness schema scrub'
status: open
priority: P0
owner: fabric-os
date: 2026-06-24
document_type: prd
tier: product
tags: [fabric-os, roadmap]
review_cycle: on-change
---

# FEAT-FABRIC-ASSURANCE-WITNESS-LANE

All fabric-owned assurance witnesses use a uniform external-assurance lane schema so fleet consumers never infer engineering blocks.

## Stories

- `MATURITY-LANE-FAB-002`

## Witness glob (scrub targets)

- `audit/evidence/secas-*-latest.json`
- `audit/evidence/legal*-latest.json`
- `audit/evidence/*pentest*-latest.json`
- `audit/evidence/*soc2*-latest.json`
- `audit/evidence/m3-external-certification-latest.json`
