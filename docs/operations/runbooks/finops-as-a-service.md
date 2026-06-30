---
title: 'FinOps as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'finops', 'cost', 'fabric']
review_cycle: on-change
---

# FinOps as a Service

Fabric OS owns infrastructure cost attribution, cost-policy consumption, and
fleet cost witnesses. Bridge OS remains the policy system of record.

## System of Record

| Artifact                | Path                                                     | Role                                             |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| FinOps spec             | `machine/spec/finops-as-a-service.json`                  | Lane contract                                    |
| Friction register       | `machine/finops-friction-register.json`                  | Cost friction state                              |
| Cost audit              | `platform/scripts/cost/run-infra-cost-audit.mjs`         | AWS cost evidence                                |
| AWS optimization export | `platform/scripts/cost/aws-cost-optimization-export.mjs` | Cost Optimization Hub / Compute Optimizer export |
| FinOps check            | `platform/scripts/finops-check.mjs`                      | Local lane gate                                  |
| Latest witness          | `audit/evidence/finops-check-latest.json`                | Local FinOps witness                             |
| Deployment contract     | `machine/spec/deployment-ops-contract.json`              | CI/deploy cost posture                           |

## Commands

```bash
pnpm finops:check
pnpm finops:check:write
pnpm infra:cost:audit:write
pnpm finops:aws-optimization:export:write
```

## Rules

- Fabric OS writes redacted cost witnesses only.
- Cost policy and governance specs are consumed from Bridge OS.
- Product repos do not own shared cloud cost policy.
- Production-critical CI uses on-demand AWS CodeBuild first; do not introduce
  always-on runner fleets until measured utilization crosses break-even.
- GitHub Actions is not a production deploy dependency while billing is blocked.
- Argo CD sync evidence and CodeBuild execution cost should be included in
  release and FinOps evidence when deployment work changes.
- AWS Cost Optimization Hub and Compute Optimizer exports are dry-run by
  default; use `--execute` only in a credentialed AWS session.
