---
title: 'Runbooks'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['runbooks', 'incident-response', 'operations', 'on-call']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# Runbooks

Operational runbooks for the GTCX compliance substrate — deployment, incident response, recovery, rotation, and service-level objective enforcement.

## By category

### Deployment + release

| Runbook                                                                   | Purpose                                     |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| [`deploy.md`](./audit-dr/deploy.md)                                       | Canary deployment, approval gates, rollback |
| [`deployment-runbook.md`](./audit-dr/deployment-runbook.md)               | Step-by-step deployment procedure           |
| [`migrate.md`](./sre/migrate.md)                                          | Database migration procedures               |
| [`release.md`](./sre/release.md)                                          | Release gate + evidence                     |
| [`release-evidence.md`](./sre/release-evidence.md)                        | Release evidence collection                 |
| [`tenant-onboarding.md`](./incident/tenant-onboarding.md)                 | New-tenant provisioning end-to-end          |
| [`terraform-state-migration.md`](./incident/terraform-state-migration.md) | Terraform state move procedure              |
| [`audit-flush-deployment.md`](./audit-dr/audit-flush-deployment.md)       | audit-flush sidecar deployment              |

### Incident response

| Runbook                                                                           | Purpose                                                                 |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`incident-response.md`](./deploy/incident-response.md)                           | General incident handling procedure                                     |
| [`audit-chain-incident-response.md`](./audit-dr/audit-chain-incident-response.md) | P0 path when `verifyChain` reports `valid: false` on a production batch |
| [`audit-signing-key-rotation.md`](./audit-dr/audit-signing-key-rotation.md)       | Scheduled + compromise-suspected Ed25519 keypair rotation               |
| [`replay-guard-failure.md`](./sre/replay-guard-failure.md)                        | Replay-protection failure response                                      |
| [`latency-slo-breach.md`](./sre/latency-slo-breach.md)                            | Latency-SLO violation response                                          |
| [`quality-runbook.md`](./sre/quality-runbook.md)                                  | CI / quality-gate triage order                                          |

### Recovery

| Runbook                                                     | Purpose                            |
| ----------------------------------------------------------- | ---------------------------------- |
| [`disaster-recovery.md`](./deploy/disaster-recovery.md)     | DR failover + restore              |
| [`database-failover.md`](./audit-dr/database-failover.md)   | Database failover procedure        |
| [`automated-rollback.md`](./audit-dr/automated-rollback.md) | Automatic rollback triggers + flow |
| [`rollback-evidence.md`](./incident/rollback-evidence.md)   | Rollback evidence collection       |

### Monitoring + SLOs

| Runbook                                                        | Purpose                         |
| -------------------------------------------------------------- | ------------------------------- |
| [`monitoring.md`](./sre/monitoring.md)                         | Observability + alerting        |
| [`agx-error-budget.md`](./audit-dr/agx-error-budget.md)        | AGX error budget tracking       |
| [`anisa-error-budget.md`](./audit-dr/anisa-error-budget.md)    | ANISA error budget tracking     |
| [`protocols-error-budget.md`](./sre/protocols-error-budget.md) | Protocols error budget tracking |

### Intelligence / ML

| Runbook                                                                         | Purpose                                |
| ------------------------------------------------------------------------------- | -------------------------------------- |
| [`fine-tune-workflow-enablement.md`](./deploy/fine-tune-workflow-enablement.md) | ML fine-tune workflow setup            |
| [`fine-tune-workflow-operations.md`](./deploy/fine-tune-workflow-operations.md) | ML fine-tune workflow day-2 ops        |
| [`intelligence-error-rate.md`](./deploy/intelligence-error-rate.md)             | AI/ML error rate monitoring            |
| [`intelligence-evidence.md`](./deploy/intelligence-evidence.md)                 | AI/ML evidence collection              |
| [`production-store-integration.md`](./sre/production-store-integration.md)      | Production store integration procedure |

### Templates

| File                                                    | Purpose                         |
| ------------------------------------------------------- | ------------------------------- |
| [`runbook-template.md`](./incident/runbook-template.md) | Blank scaffold for new runbooks |

## On-call priorities

When multiple runbooks apply simultaneously, follow this precedence:

| Priority                   | Trigger                                      | Runbook                                                                                       |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| P0 (load-bearing security) | `verifyChain` fails on production WORM batch | [`audit-chain-incident-response.md`](./audit-dr/audit-chain-incident-response.md)             |
| P0 (load-bearing security) | Suspected signing-key compromise             | [`audit-signing-key-rotation.md`](./audit-dr/audit-signing-key-rotation.md) §5 emergency path |
| P0 (general)               | Full service outage / data breach            | [`incident-response.md`](./deploy/incident-response.md)                                       |
| P1                         | Partial outage / major feature broken        | [`incident-response.md`](./deploy/incident-response.md)                                       |
| P1                         | SLO breach with budget burn rate > 14×       | [`latency-slo-breach.md`](./sre/latency-slo-breach.md)                                        |
| P2                         | Degraded performance                         | Per-service error-budget runbook                                                              |
| P2                         | Database failover needed                     | [`database-failover.md`](./audit-dr/database-failover.md)                                     |
| P3                         | DR rehearsal due                             | [`disaster-recovery.md`](./deploy/disaster-recovery.md)                                       |

## What belongs here

- Incident response playbooks
- Escalation procedures
- On-call rotation schedules
- Service recovery procedures
- Post-mortem templates

## What does NOT belong here

- Monitoring architecture → the [`monitoring.md`](./sre/monitoring.md) runbook
- Deployment automation source → CI workflows under `.github/workflows/`
- Architecture decisions about operational behavior → [`../../decisions/README.md`](../../architecture/decisions/README.md) (ADRs)
- SLO definitions → [`../slo-definitions.md`](../core-ops/batch-b/slo-definitions.md)

## Adding a new runbook

1. Copy [`runbook-template.md`](./incident/runbook-template.md) to `<kebab-case-name>.md`
2. Fill in incident classification + severity, on-call rotation, playbook, escalation, rollback, communication, post-mortem
3. Add an entry to the appropriate category table above
4. Add to the on-call priority table if it's a P0/P1 trigger
5. Add Mermaid sequence/state diagram if the procedure has > 5 steps with timing relationships
