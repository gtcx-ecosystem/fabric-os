---
storyId: WC-SECOPS-007
initiativeId: INIT-WORLD-CLASS-SECOPS
title: SOC L3 operationalization — SIEM, on-call, TI feed
status: open
priority: P2
owner: fabric-os
lane: engineeringMaturity
blocksGtmStage: false
blocksSprintSeal: false
date: 2026-06-24
---

# WC-SECOPS-007 — SOC L3 uplift

## Value

Close WC-07 gap: operational SIEM ingest, on-call paging, and threat-intel feed tied to IR runbook.

## Acceptance

- [ ] `pnpm secas:csirt:check:write` PASS (structural + drill)
- [ ] `fleet-threat-register` TI entries sourced from live feed stub
- [ ] On-call roster linked in csirt-operating-model.md

## QA

```bash
pnpm secas:csirt:check:write
pnpm fleet:threat:check:write
```
