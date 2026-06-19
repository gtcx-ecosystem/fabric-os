---
title: 'LegalOps as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'legalops', 'fabric']
review_cycle: on-change
---

# LegalOps as a Service

Fabric OS owns the LegalOps lane for the service fabric: friction register,
runbook, local harness, and fleet witness. Product repos consume LegalOps by
linking the manifest href; they do not copy legal gates, approval text, or
sovereign decision records.

Class S legal actions remain human-sovereign gates. They are recorded as
parallel gates with `blocksIR: false` so engineering, deployment, security, and
Ops evidence work can continue while legal artifacts are executed by the
authorized humans.

## System of Record

| Artifact             | Path                                                                | Role                                       |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| LegalOps spec        | `pm/spec/legalops-as-a-service.json`                                | Lane contract and artifact map             |
| Friction register    | `pm/legal-friction-register.json`                                   | Fabric-owned legal friction and gate state |
| Local manifest       | `ops/legal/manifest.json`                                           | Local repo LegalOps pointer                |
| Local harness        | `platform/scripts/legalops-check.mjs`                               | Structural lane check                      |
| Friction harness     | `platform/scripts/legal-friction-check.mjs`                         | Register depth check                       |
| Local witness        | `audit/evidence/legalops-check-latest.json`                         | Latest Fabric LegalOps witness             |
| Fleet protocol       | `bridge-os/pm/spec/ecosystem-legal-program-protocol.json`           | Program office contract                    |
| Fleet witness        | `bridge-os/pm/ci/ops-lanes-100/legalops-fleet-latest.json`          | Fleet LegalOps rollup                      |
| Human gates manifest | `canon-os/ops/coordination/hub-narrative/human-gates.manifest.json` | Canon href only                            |

## Operating Rules

- Fabric OS is the register owner for service-fabric LegalOps.
- Product repos hold manifest pointers only; they must not duplicate legal gate
  text or approval records.
- Agents must not execute legal signatures, countersignatures, auditor opinions,
  insurance approvals, or vendor legal commitments.
- Class S legal rows are reported under parallel sovereign gates, not as product
  engineering blockers.
- `blocksIR` defaults to `false` unless the register explicitly says otherwise.
- Evidence written by agents must be redacted and must not contain raw legal
  documents, secrets, or credentials.

## Commands

Run the local lane checks from `fabric-os`:

```bash
pnpm legalops:check
pnpm legalops:check:write
pnpm legal:friction:check:write
```

Run the fleet LegalOps witness from the program office checkout:

```bash
pnpm --dir ../bridge-os ecosystem:legal-program:check:write
```

Run the Fabric Ops aggregate gate:

```bash
pnpm fabric:ops:check
```

## Agent Handling

When a LegalOps item appears during implementation:

1. Check `pm/legal-friction-register.json` for the canonical row.
2. If the row is Class R, update the Fabric-owned artifact and refresh the
   witness.
3. If the row is Class S, record only the blocker state and unblock path in the
   parallel sovereign gates section.
4. Do not ask the operator to choose between legal execution and engineering
   work; continue Class R implementation when `blocksIR: false`.

## Exit Criteria

LegalOps is operational when:

- `pnpm legalops:check` passes.
- `pnpm legal:friction:check:write` writes a passing witness.
- `pnpm --dir ../bridge-os ecosystem:legal-program:check:write` writes the fleet
  witness.
- `pnpm fabric:ops:check` includes the LegalOps gate in a passing aggregate.
