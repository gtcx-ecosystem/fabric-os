---
storyId: FOAP-007
initiativeId: INIT-FLEET-OPS-ASSURANCE-PROGRAM
featureId: FEAT-FLEET-OPS-ASSURANCE-MASTER-HARNESS
title: Master fleet-ops-assurance-check harness + fabric:operations wire
status: done
priority: P0
owner: fabric-os
lane: engineeringMaturity
blocksGtmStage: false
blocksSprintSeal: false
date: 2026-06-24
---

# FOAP-007 — Master fleet ops assurance harness

## Value

Single operator entry to verify the entire centralized security/compliance/legal/ops programme is operational — fabric + bridge witnesses green.

## Acceptance

- [ ] `pnpm fleet-ops-assurance:check:write` → `audit/evidence/fleet-ops-assurance-check-latest.json` PASS
- [ ] `pnpm fabric:operations:check` includes fleet-ops-assurance gate
- [ ] `pnpm --dir ../bridge-os ecosystem:fleet-ops-assurance:check:write` PASS

## QA

```bash
pnpm fleet-ops-assurance:check:write
pnpm generate:fleet-ops-assurance-roadmap
pnpm fabric:operations:check
```
