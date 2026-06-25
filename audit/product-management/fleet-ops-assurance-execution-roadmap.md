---
title: Execution roadmap — Fleet Ops Assurance
status: current
date: 2026-06-24
last_reconciled: 2026-06-24T17:23:57.510Z
owner: fabric-os
program: INIT-FLEET-OPS-ASSURANCE-PROGRAM
generated: true
generated_by: platform/scripts/generate-fleet-ops-assurance-roadmap.mjs
sources:
  - machine/fleet-ops-assurance-roadmap.json
  - machine/fleet-ops-assurance-stories.json
  - machine/fleet-ops-friction-register.json
  - pm/spec/fleet-ops-assurance-program.json
---

# Fleet Ops Assurance Program — execution roadmap

> **Generated file.** Edit machine JSON SoR, then `pnpm generate:fleet-ops-assurance-roadmap`.

**Coordinator:** bridge-os (`ecosystem:ops-lanes-100`) · **Owner:** fabric-os

## Active Phase: FOAP complete

**Status:** `complete`

## Parallel assurance friction (blocksIR: false)

| ID                   | Lane          | Class | Status | Programme                |
| -------------------- | ------------- | ----- | ------ | ------------------------ |
| FOAF-SECAS-VENDOR    | SecOps        | A     | open   | PROG-SECAS-EXTERNAL      |
| FOAF-SOC2-OPINION    | SecOps        | S     | open   | PROG-SOC2-PARALLEL       |
| FOAF-LEGAL-ZWCMP     | LegalOps      | S     | open   | PROG-LEGAL-EXT-INF       |
| FOAF-LEGAL-SLA       | LegalOps      | S     | open   | PROG-LEGAL-EXT-INF       |
| FOAF-LEGAL-H03       | LegalOps      | S     | open   | PROG-LEGAL-EXT-INF       |
| FOAF-COMPLIANCE-11PR | ComplianceOps | R     | open   | INIT-GTCX-COMPLIANCE-OPS |
| FOAF-OPS-11PR-HR-ML  | HROps         | R     | open   | —                        |

## All sprints

| Sprint  | Goal                                                               | Status   |
| ------- | ------------------------------------------------------------------ | -------- |
| FOAP-S0 | Policy + lane separation (GS-MATURITY-LANE-001 / GS-GTM-STAGE-002) | complete |
| FOAP-S1 | Central assurance programme + witness contract                     | complete |
| FOAP-S2 | SecOps + LegalOps friction parity                                  | complete |
| FOAP-S3 | Master harness + fleet rollup operational                          | complete |
| FOAP-S4 | ComplianceOps + RevOps sustain (11PR uplift)                       | complete |
| FOAP-S5 | Post-launch external calendar (vendor parallel only)               | parallel |

## Verification

```bash
pnpm fleet-ops-assurance:check:write
pnpm --dir ../bridge-os ecosystem:ops-lanes-100:check:write
pnpm --dir ../bridge-os ecosystem:ops-lanes-sprints:seal:write
```
