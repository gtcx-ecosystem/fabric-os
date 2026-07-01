---
title: 'QASC/DSLC/SHIP fleet parity'
status: current
date: 2026-07-01
owner: fabric-os
authority: GTCX-QASC-001 + GTCX-DSLC-001 + GTCX-SHIP-001
version: 1.0.0
---

# QASC/DSLC/SHIP Fleet Parity

Command health: **pass**.
Strict pass: **no** (2/21 repos at parity).

| Classification  | Count |
| --------------- | ----: |
| local-complete  |     1 |
| fabric-provider |     1 |
| delegated       |     0 |
| exempt          |     0 |
| gap             |    19 |

| Repo           | Classification  | Valid | Next remediation                                                                                                                                                                  |
| -------------- | --------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| agile-os       | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| baseline-os    | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| bridge-os      | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| canon-os       | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| compliance-os  | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| document-os    | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| ecosystem-os   | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| exploration-os | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| fabric-os      | fabric-provider | yes   | Maintain Fabric-owned AaaS/QASC/DSLC/SHIP provider contracts and release commands.                                                                                                |
| griot-ai       | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| gtcx-os        | local-complete  | yes   | Maintain repo-local QASC/DSLC/SHIP scripts, specs, and latest witnesses.                                                                                                          |
| inspection-os  | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| ledger-os      | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| ledger-ui      | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| markets-os     | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| nyota-ai       | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| sensei-os      | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| terminal-os    | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| terra-os       | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| venture-os     | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| veritas-ai     | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |

Machine witness: `audit/evidence/qasc-dslc-ship-fleet-parity-latest.json`.
