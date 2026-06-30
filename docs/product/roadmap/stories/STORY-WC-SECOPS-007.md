---
storyId: WC-SECOPS-007
initiativeId: INIT-WORLD-CLASS-SECOPS
title: SOC L3 operationalization — SIEM, on-call, TI feed
status: done
priority: P2
owner: fabric-os
lane: engineeringMaturity
blocksGtmStage: false
blocksSprintSeal: false
date: 2026-06-24
document_type: prd
tier: product
tags: [fabric-os, roadmap]
review_cycle: on-change
---

# WC-SECOPS-007 — SOC L3 uplift

## Value

Close WC-07 gap: operational SIEM ingest, on-call paging, and threat-intel feed tied to IR runbook.

## Acceptance

- [x] `pnpm secas:csirt:check:write` PASS (structural + drill)
- [x] `fleet-threat-register` TI entries sourced from live feed stub (`threatIntelFeed` 1, provider `ti-feed-pending`)
- [x] On-call roster linked in csirt-operating-model.md (rotation table + HROps registry SoR)

> SIEM vendor live-feed wiring is Class A (vendor SOW) — tracked separately; stub feed satisfies L3 structural acceptance.

## QA

```bash
pnpm secas:csirt:check:write
pnpm fleet:threat:check:write
```
