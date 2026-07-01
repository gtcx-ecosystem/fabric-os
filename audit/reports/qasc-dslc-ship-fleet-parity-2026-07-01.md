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
Strict pass: **no** (13/21 repos at parity).

| Classification  | Count |
| --------------- | ----: |
| local-complete  |     1 |
| fabric-provider |     1 |
| delegated       |    11 |
| exempt          |     0 |
| gap             |     8 |

| Repo           | Classification  | Valid | Next remediation                                                                                                                                                                  |
| -------------- | --------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| agile-os       | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| baseline-os    | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| bridge-os      | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| canon-os       | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| compliance-os  | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| document-os    | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| ecosystem-os   | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| exploration-os | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| fabric-os      | fabric-provider | yes   | Maintain Fabric-owned AaaS/QASC/DSLC/SHIP provider contracts and release commands.                                                                                                |
| griot-ai       | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| gtcx-os        | local-complete  | yes   | Maintain repo-local QASC/DSLC/SHIP scripts, specs, and latest witnesses.                                                                                                          |
| inspection-os  | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| ledger-os      | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| ledger-ui      | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| markets-os     | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| nyota-ai       | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| sensei-os      | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| terminal-os    | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| terra-os       | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |
| venture-os     | delegated       | yes   | Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.                                                                                                 |
| veritas-ai     | gap             | no    | Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses. |

Machine witness: `audit/evidence/qasc-dslc-ship-fleet-parity-latest.json`.
