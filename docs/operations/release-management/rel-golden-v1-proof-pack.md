---
title: 'REL-GOLDEN-V1 release-management proof pack'
status: draft
date: 2026-07-01
owner: gtcx-release-management
document_type: release-evidence
tier: operations
tags: [release-management, golden-v1, proof-pack]
review_cycle: on-change
release: REL-GOLDEN-V1
release_class: pilot
authority: GTCX-DSLC-001 + GTCX-SHIP-001
---

# REL-GOLDEN-V1 Release-Management Proof Pack

## Scope

`REL-GOLDEN-V1` is the canonical pilot-class proof pack for driving the GTCX
QASC → DSLC → SHIP chain to true `100/100` and SIGNAL `L5`.

Head product candidate: `markets-os`.

Current release boundary:

- QASC prerequisite: `../markets-os/audit/evidence/qasc-repo-latest.json`
- MPR prerequisite: `../markets-os/audit/evidence/mpr-repo-latest.json`
- SIGNAL prerequisite: `../markets-os/audit/evidence/signal-maturity-latest.json`
- DSLC manifest: `machine/dslc/releases/REL-GOLDEN-V1/manifest.json`
- SHIP manifest: `machine/ship/releases/REL-GOLDEN-V1/manifest.json`

This pack is not a release approval. It is the release-manager working packet.

## Operator runbook

1. Confirm the exact pilot participant, jurisdiction, data scope, and activation window.
2. Bind the pilot environment and tenant configuration.
3. Confirm secrets, migrations, feature flags, service routes, and rollback target.
4. Confirm SLOs, alerts, incident owner, customer support owner, and escalation path.
5. Run DSLC:

   ```bash
   pnpm dslc:release:write -- --manifest machine/dslc/releases/REL-GOLDEN-V1/manifest.json --json
   ```

6. Run SHIP:

   ```bash
   pnpm ship:release:write -- --manifest machine/ship/releases/REL-GOLDEN-V1/manifest.json --json
   ```

7. If either gate remains blocked, close the specific blocker and rerun the same command.

## Deployment binding checklist

The following items must be attached before deployment activation:

| Item                   | Status  | Required evidence                                                   |
| ---------------------- | ------- | ------------------------------------------------------------------- |
| Pilot tenant / account | pending | CRM/account record or explicit internal pilot target                |
| Environment            | pending | staging/pilot URL, cluster/namespace, or approved non-runtime scope |
| Feature flags          | pending | feature flag inventory with default/rollback state                  |
| Secrets/config         | pending | redacted config witness; no raw secrets                             |
| Migrations             | pending | migration state or explicit no-migration witness                    |
| Rollback               | pending | release-manager approved rollback path                              |
| Post-deploy probe      | pending | command output or probe witness                                     |

## SLO and observability checklist

| Control          | Target evidence                              |
| ---------------- | -------------------------------------------- |
| Availability SLO | service target or explicit non-runtime scope |
| Latency SLO      | API/surface-specific target                  |
| Error budget     | pilot tolerance and owner                    |
| Alerts           | alert route, owner, and escalation           |
| Dashboards       | dashboard link or local evidence artifact    |
| Incident process | incident commander and support path          |

## Release-manager attestation boundary

Final release-manager attestation is Class A and cannot be synthesized by an agent.

The attestation must state:

- DSLC decision is `ready` at `100/100`.
- SHIP decision is `ready` at `100/100`.
- All Class S legal/signature gates are real human-approved artifacts.
- All Class A approvals include named approver and durable evidence.
- Rollback boundary is understood and executable.

## Current known blockers

- DSLC legal agreement/signatory Class S artifacts are missing.
- Commercial offer/SKU/pricing approval is missing.
- Pilot environment binding and post-deploy verification are missing.
- GitBook/public docs and changelog issuance approvals are missing.
- Final release-manager attestation is missing.
