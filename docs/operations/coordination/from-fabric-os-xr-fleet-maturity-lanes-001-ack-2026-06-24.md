---
title: 'outbound-ack — XR-FLEET-MATURITY-LANES-001 + XR-GTM-ASSURANCE-LANE-002'
status: sealed
date: 2026-06-24
from: fabric-os
to: baseline-os, bridge-os, agile-os, canon-os, compliance-os
initiative: INIT-XR-FLEET-MATURITY-LANES
ticket: XR-FLEET-MATURITY-LANES-001
related: XR-GTM-ASSURANCE-LANE-002, GS-MATURITY-LANE-001, GS-GTM-STAGE-002
authorityClass: R
protocol: P24
blocksIR: false
owner: fabric-os
---

# outbound-ack — XR-FLEET-MATURITY-LANES-001

- **Status:** sealed (W0–W3 complete — fabric · bridge · baseline · agile)
- **Owner:** fabric-os
- **Evidence:** `pnpm maturity-lane:check:write` PASS · `pnpm central-assurance:check:write` PASS · `pnpm fabric:operations:check` exit 0 · 7/7 assurance witnesses

## Ack

fabric-os accepts **central ownership** of the external assurance lane (SECAS, LegalOps, BG-10-_, EXT-INF-_, vendor calendar). Engineering maturity and integrator-pilot GTM (`GR-T2`, Africa/Global South default) must **not** downgrade when assurance or procurement gaps are open.

Policy is normative (`GS-MATURITY-LANE-001`, `GS-GTM-STAGE-002`). The defect is **fleet wiring and display** — fabric-os will enforce witness contract, health-probe isolation, and a single assurance programme backlog so product repos reference fabric witness IDs only.

## bridge-os handoff — accepted requirements

Same deliverables #1–4 as agile-os (central programme, witness contract, health probe, vocabulary). bridge-os **cannot** close fleet display until fabric Wave 1 lands witness contract + central programme.

**Inbound:** [`inbound/from-bridge-os-maturity-lane-feedback-2026-06-24.md`](./inbound/from-bridge-os-maturity-lane-feedback-2026-06-24.md)

| bridge defect                              | bridge story          | fabric dependency                           |
| ------------------------------------------ | --------------------- | ------------------------------------------- |
| Linear `inferGtmReadiness`                 | `BRG-001`             | witness `blocksGtmStage: false` (`FAB-002`) |
| `session-open-items` blockedExternal bleed | bridge fix (TBD)      | fabric vocabulary (`FAB-004`)               |
| `parallelClassS` in product Proceed Brief  | `BRG-003`             | `BL-002` P22 value compose                  |
| `evaluate-gtm-readiness` no lane split     | `BRG-002` / canon P58 | `FAB-002` witness ingest                    |

**Parallel execution:** bridge executes `BRG-001` + `BRG-003` while fabric Wave 1 runs — policy settled; wiring defect only.

## agile-os handoff — accepted requirements

| ID  | Requirement                                                   | fabric-os story                                                        |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A   | Single assurance programme owner (no scattered repo backlogs) | `MATURITY-LANE-FAB-005`                                                |
| B   | Machine-enforceable witness contract                          | `pm/spec/assurance-lane-witness-fields.json` · `MATURITY-LANE-FAB-002` |
| C   | Fleet health probe isolation                                  | `MATURITY-LANE-FAB-003`                                                |
| D   | Coordination vocabulary (Parallel sovereign gates)            | `MATURITY-LANE-FAB-004` · runbooks                                     |

## Handoff closure criteria (fabric-os)

| #   | Criterion                                                                | Witness                                                                   |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 1   | All SECAS/BG/EXT-INF witnesses carry lane separation fields              | `pnpm maturity-lane:check:write`                                          |
| 2   | No `blocksAnyRepo: true` on vendor-calendar items                        | `audit/evidence/m3-external-certification-latest.json` pattern fleet-wide |
| 3   | Central assurance backlog; product repos zero blocking assurance stories | `machine/spec/central-assurance-program.json` + bridge fleet audit        |
| 4   | This ack + program rollup committed                                      | this file                                                                 |
| 5   | `inferGtmReadiness` amended (joint bridge-os)                            | bridge `MATURITY-LANE-BRG-001` · GS-GTM-STAGE-002 gate                    |

## Dependencies (not fabric-os alone)

| Owner       | Work                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| bridge-os   | `inferGtmReadiness` productStage vs procurementAssurance split (`BRG-001`)       |
| baseline-os | P22 `composeValueCreated` lane isolation (`BL-002`)                              |
| agile-os    | Repeal fleet-agile-hub “blocks/succeeds fleet milestones”; sprint seal (`AGL-*`) |
| canon-os    | P58 `gtmStageModel` split (in flight)                                            |

## Verification path (operator)

```bash
# Defect signature today — engineering green, gtm.stage capped by soc2Path
jq '.repos[] | {repo: .repoId, eng: .diagnostics.engineering.score100, gtm: .diagnostics.gtm.stage, gaps: .diagnostics.gtm.gaps}' \
  ../bridge-os/pm/ci/fleet-diagnostic-dashboard-latest.json

# Target state (fabric Wave 1 + bridge BRG-001)
pnpm maturity-lane:check:write
pnpm daas:fleet:health --write
pnpm --dir ../bridge-os ecosystem:fleet:diagnostic:refresh:write
# expect: integratorPilotReadyCount > 0 when engineering composite green
```

## Next fabric-os implementation (Wave 1)

1. `MATURITY-LANE-FAB-001` — pin + check harness
2. `MATURITY-LANE-FAB-002` + witness contract spec
3. `MATURITY-LANE-FAB-005` — central assurance programme register
4. `MATURITY-LANE-FAB-003` — health probe isolation
