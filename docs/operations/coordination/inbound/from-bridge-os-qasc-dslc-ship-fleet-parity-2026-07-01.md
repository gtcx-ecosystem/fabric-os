---
title: 'Inbound — bridge-os QASC/DSLC/SHIP fleet parity handoff'
status: current
date: 2026-07-01
from: bridge-os
to: fabric-os
story: FABRIC-QASC-DSLC-SHIP-FLEET-PARITY-001
authorityClass: R
protocol: P24
owner: fabric-os
document_type: coordination-handoff
tier: operating
tags: [fabric-os, bridge-os, aaas, qasc, dslc, ship, fleet-parity, coordination]
review_cycle: on-change
---

# Inbound — Bridge reference for Fabric-owned QASC/DSLC/SHIP fleet parity

## Request

Bridge identified a fleet-level ownership and parity gap while validating whether
QASC, DSLC, and SHIP exist across other repositories after `gtcx-os` gained
repo-local protocol gates.

Fabric owns AaaS orchestration and the QASC/DSLC/SHIP protocol contract surface.
Bridge is a reference point only: agent orchestration, cross-repo metadata, and
MPR/SIGNAL runtime/scoring dependencies. Do not implement the fleet parity
contract in `bridge-os`.

## Ownership boundary

| Concern                                                              | Owner       | Boundary                                                  |
| -------------------------------------------------------------------- | ----------- | --------------------------------------------------------- |
| AaaS orchestration, contract checks, cadence, honesty, fleet indexes | `fabric-os` | System of record for the fleet audit/contract surface     |
| QASC protocol contract                                               | `fabric-os` | `machine/spec/qasc-contract.json`; commands `qasc:*`      |
| DSLC protocol contract                                               | `fabric-os` | `machine/spec/dslc-contract.json`; commands `dslc:*`      |
| SHIP protocol contract                                               | `fabric-os` | `machine/spec/ship-contract.json`; commands `ship:*`      |
| MPR/SIGNAL runtime and cross-repo metadata references                | `bridge-os` | Engine/dependency reference; not protocol ownership       |
| Local protocol implementation evidence                               | each repo   | Repo-local gates, witnesses, manifests, and release proof |

## Bridge reference evidence

- `bridge-os/AGENTS.md` states the AaaS standard is Fabric-owned:
  `fabric-os/machine/spec/aaas-audit-taxonomy.json`,
  `fabric-os/machine/spec/aaas-command-surface.json`, and Fabric-owned cadence,
  honesty, and contract gates.
- `fabric-os/machine/spec/qasc-contract.json` already declares:
  - `ownerRepo: fabric-os`
  - QASC quality-assurance service owner: `fabric-os`
  - MPR/SIGNAL/runtime engines: `bridge-os`
- `fabric-os/machine/spec/dslc-contract.json` already declares:
  - `ownerRepo: fabric-os`
  - assurance/deployment/protocol runtime: `fabric-os`
  - runtime/cross-repo metadata: `bridge-os`
- `fabric-os/machine/spec/ship-contract.json` already declares:
  - `ownerRepo: fabric-os`
  - release-management runtime: `fabric-os`
  - runtime/cross-repo metadata: `bridge-os`
- `gtcx-os` reference implementation:
  - branch: `feat/offtake-protocols`
  - PR: `gtcx-ecosystem/gtcx-ecosystem#7`
  - commits:
    - `e4954c61 fix(release): anchor readiness to tracked workspace`
    - `68ddc26e chore(release): refresh readiness witnesses`
    - `70229d5c feat(release): add explicit DSLC gate`

## Observed fleet state from Bridge reference scan

This is a reference scan, not the authoritative Fabric witness. Fabric should
regenerate and own the canonical witness from its own command surface.

| Repo                            | Strict local QASC/DSLC/SHIP parity | Existing signal                                                              |
| ------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `gtcx-os`                       | yes                                | Local `qasc:check`, `dslc:check`, `ship:check`, specs, and latest witnesses  |
| `fabric-os`                     | provider                           | Central `qasc:*`, `dslc:*`, `ship:*` provider contracts and release commands |
| `document-os`                   | no                                 | Delegated/partial QASC surface only                                          |
| `exploration-os`                | no                                 | Delegated/partial QASC surface only                                          |
| `inspection-os`                 | no                                 | Delegated/partial QASC surface only                                          |
| `terminal-os`                   | no                                 | Delegated/partial QASC surface only                                          |
| all other scanned package repos | no                                 | No strict local QASC/DSLC/SHIP triplet detected                              |

Reference scan denominator:

```text
agile-os
baseline-os
bridge-os
canon-os
compliance-os
document-os
ecosystem-os
exploration-os
fabric-os
griot-ai
gtcx-os
inspection-os
ledger-os
ledger-ui
markets-os
nyota-ai
sensei-os
terminal-os
terra-os
venture-os
veritas-ai
```

## Required Fabric work

Create or extend a Fabric-owned fleet parity check that classifies every active
repo against the QASC/DSLC/SHIP protocol model.

Required classifications:

- `local-complete` — repo carries local QASC, DSLC, and SHIP gates, specs, and
  latest witnesses.
- `fabric-provider` — Fabric-owned central provider surface; applies to
  `fabric-os` only unless the contract explicitly adds another provider.
- `delegated` — repo intentionally delegates one or more protocol gates to
  Fabric and has a pinned contract plus current delegated witness.
- `exempt` — repo is explicitly exempt by versioned Fabric contract with reason,
  owner, expiry/review date, and impact.
- `gap` — repo has no valid local, delegated, provider, or exempt status.

The check should emit a machine-readable witness under Fabric-owned evidence,
for example:

```text
audit/evidence/qasc-dslc-ship-fleet-parity-latest.json
audit/reports/qasc-dslc-ship-fleet-parity-YYYY-MM-DD.md
```

## Acceptance criteria

1. Fabric owns the parity contract.
   - Contract/spec location is under `fabric-os/machine/spec/`.
   - Witnesses/reports are under `fabric-os/audit/evidence/` and
     `fabric-os/audit/reports/`.

2. The check is callable from Fabric package scripts.
   - Add canonical scripts under `fabric-os/package.json`.
   - Keep names aligned with the existing `qasc:*`, `dslc:*`, `ship:*`, and
     `aaas:*` command surface.

3. The witness distinguishes command health from fleet parity.
   - Command health may pass if the scan completes.
   - Fleet parity must expose strict pass/fail separately.
   - Gaps must remain visible; do not hide them behind advisory wording.

4. The check does not make Bridge the owner.
   - Bridge paths may be cited as runtime/scoring/reference dependencies.
   - No Bridge-owned contract or witness should become the system of record for
     QASC/DSLC/SHIP fleet parity.

5. The check produces repo-level remediation instructions.
   - For each `gap`, identify the missing local scripts/specs/witnesses or the
     missing delegated Fabric contract.
   - For each `delegated`, identify the Fabric command and witness consumed by
     the repo.

6. Existing Fabric protocol tests are extended.
   - `qasc:test`, `dslc:test`, and `ship:test` should cover the new parity
     semantics or call a shared parity test.
   - `aaas:contract:check` should continue to pass after the contract update.

## Suggested verification commands

Run from `fabric-os`:

```bash
pnpm qasc:contract:check
pnpm dslc:contract:check
pnpm ship:contract:check
pnpm qasc:test
pnpm dslc:test
pnpm ship:test
pnpm aaas:contract:check
```

After implementing the new parity command, also run:

```bash
pnpm <fabric-owned-parity-command>:write
pnpm <fabric-owned-parity-command>:strict
```

The strict command is expected to fail until non-`gtcx-os` repos either adopt
local parity or receive explicit delegated/exempt contract entries.

## Resume condition

This handoff is ready to close when Fabric has:

- a versioned machine spec for QASC/DSLC/SHIP fleet parity,
- a Fabric package script that generates the latest parity witness,
- test coverage for the classification rules,
- a current witness showing every repo as `local-complete`, `fabric-provider`,
  `delegated`, `exempt`, or `gap`,
- and outbound remediation handoffs for every `gap` repo.
