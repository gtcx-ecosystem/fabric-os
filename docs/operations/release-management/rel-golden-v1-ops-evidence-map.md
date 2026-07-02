---
title: 'REL-GOLDEN-V1 ops evidence map'
status: current
date: 2026-07-01
owner: fabric-os
document_type: release-evidence
tier: operations
tags: [release-management, golden-v1, evidence]
review_cycle: on-change
release: REL-GOLDEN-V1
---

# REL-GOLDEN-V1 Ops Evidence Map

This map binds `REL-GOLDEN-V1` to existing `markets-os` operational witnesses.
The source artifacts are read-only sibling-repo evidence. Claim boundaries from
those artifacts remain binding.

## Read-only source evidence

| Evidence                                                               | Decision/use                                      | Boundary retained from source                              |
| ---------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `../markets-os/audit/evidence/live-env-readiness-latest.json`          | Environment contract and manifest coverage        | Runtime values, service probes, and DB probes were skipped |
| `../markets-os/audit/evidence/production-observability-latest.json`    | SLO workflows, alert owners, telemetry primitives | Live trace and alert export pending                        |
| `../markets-os/audit/evidence/production-launch-readiness-latest.json` | Pilot/staging readiness summary                   | Production remains no-go; e2e transaction chain blocked    |
| `../markets-os/audit/evidence/pilot-golden-transaction-latest.json`    | Pilot golden transaction gates                    | Gates-only; not regulated production approval              |
| `../markets-os/audit/evidence/transaction-test-run-latest.json`        | Transaction test-run status                       | Staging API chain/runtime credential path blocked          |
| `../markets-os/docs/operations/runbooks/production-observability.md`   | Observability runbook                             | Launch readiness, not live trace capture                   |
| `../markets-os/docs/operations/runbooks/env-readiness.md`              | Environment readiness runbook                     | Redacted environment readiness only                        |

## DSLC interpretation

- `environment-config-migrations` remains pending because live runtime values,
  service reachability, and database connectivity are not proven.
- `observability-alerting-slo` remains pending because live trace and alert
  export evidence are explicitly pending.
- `post-deploy-verification` remains pending because the source launch witness
  still reports the e2e transaction chain as blocked.

## SHIP interpretation

- `ops-critical-controls` remains pending until deploy, rollback,
  observability, incident, support, and live pilot verification evidence are all
  closed for the release unit.
- These artifacts are sufficient to show controlled progress and exact blockers;
  they are not sufficient to declare SHIP readiness.
