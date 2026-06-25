---
title: 'Inbound — bridge-os XR-FLEET-MATURITY-LANES-001 feedback'
status: received
date: 2026-06-24
from: bridge-os
to: fabric-os
initiative: INIT-XR-FLEET-MATURITY-LANES
ticket: XR-FLEET-MATURITY-LANES-001
related: GS-MATURITY-LANE-001, GS-GTM-STAGE-002
authorityClass: R
protocol: P24
blocksIR: false
---

# Inbound — bridge-os maturity lane feedback

**Position:** Agree. Policy normative; defect is **wiring and display**, not strategy.

## bridge-os concrete defects (accepted as fleet truth)

| #   | Defect                                                                     | Location                                   | Impact                                                |
| --- | -------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| 1   | Single linear `inferGtmReadiness` stage ladder                             | `build-fleet-diagnostic-snapshot.mjs` L55+ | `pilotReadyCount: 0` while engineering 85–100         |
| 2   | `session-open-items` merges `fabric?.blockedExternal` as `status: blocked` | `session-open-items.mjs`                   | Reads like repo freeze when `blocksIR: false`         |
| 3   | Product repos surface `parallelClassS` in Proceed Brief                    | P22 session render                         | Operators read pen-test/codesign as engineering block |
| 4   | `evaluate-gtm-readiness` no lane split                                     | bridge/fabric gtm checks                   | Assurance gaps paint product repos red                |

**Note:** `human-gate-engineering-abstraction.mjs` and `human-gates.manifest.json` already encode `blocksIR: false` — policy exists; display/GTM inference lags.

## fabric-os deliverables (bridge dependency)

| #   | Deliverable                            | fabric story                                     | Why bridge can't fix alone                          |
| --- | -------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| 1   | Central assurance backlog              | `MATURITY-LANE-FAB-005`                          | Stops scattered repo backlogs as product P0         |
| 2   | Witness contract on all assurance JSON | `FAB-002` · `assurance-lane-witness-fields.json` | Bridge ingest can label parallel vs blocking        |
| 3   | Health probe isolation                 | `MATURITY-LANE-FAB-003`                          | Cross-repo probe punishes engineering-green repos   |
| 4   | Coordination vocabulary                | `MATURITY-LANE-FAB-004`                          | "Parallel sovereign gates — does not block {story}" |

## bridge-os owns (in flight — parallel with fabric Wave 1)

| Story                   | Fix                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `MATURITY-LANE-BRG-001` | Split `inferGtmReadiness` → three lanes; `pilotReady` from integrator only             |
| `MATURITY-LANE-BRG-003` | Omit `parallelClassS` from product session unless `blocksIR: true`                     |
| `MATURITY-LANE-BRG-002` | Pilot readiness + `check-product-roadmap-lane-isolation` — no assurance in sprint seal |

bridge-os executes **BRG-001/003** in parallel with fabric Wave 1.

## Johannesburg / v1 (agreed)

- **Ship on:** engineering maturity, deploy witness, demo path, backlog clear
- **Parallel:** pen-test, codesign, SOC2 — fabric witness IDs · Class S · Parallel sovereign gates · never product Next work
- **Enterprise segment:** US/EU checklist under `enterpriseProcurementGtm` — not `gtm.stage` for Africa default

## Joint verification (post Wave 1)

```bash
# Defect signature today
jq '.repos[] | {repo: .repoId, eng: .diagnostics.engineering.score100, gtm: .diagnostics.gtm.stage, gaps: .diagnostics.gtm.gaps}' \
  bridge-os/pm/ci/fleet-diagnostic-dashboard-latest.json

# Target state
pnpm maturity-lane:check:write                    # fabric-os
pnpm daas:fleet:health --write                    # fabric-os
pnpm ecosystem:fleet:diagnostic:refresh:write     # bridge-os — integratorPilotReadyCount > 0 when eng green
```

## fabric-os ack

[`../from-fabric-os-xr-fleet-maturity-lanes-001-ack-2026-06-24.md`](../from-fabric-os-xr-fleet-maturity-lanes-001-ack-2026-06-24.md)
