---
storyId: LEGAL-PROGRAM-01
initiativeId: INIT-FLEET-OPS-ASSURANCE-PROGRAM
featureId: FEAT-FLEET-OPS-LEGAL-PARITY
title: Legal friction register parity with SECAS harness depth
status: done
priority: P1
owner: fabric-os
lane: externalAssurance
blocksGtmStage: false
blocksSprintSeal: false
auditNotes: 2026-06-15 register closed; 2026-06-24 reconciled into FOAP programme backlog
date: 2026-06-24
---

# LEGAL-PROGRAM-01 — Legal friction parity (closed)

## Acceptance

- [x] `pnpm legal:friction:check:write` PASS
- [x] `pnpm legalops:check:write` PASS
- [x] `pnpm --dir ../bridge-os ecosystem:legal-program:check:write` PASS
