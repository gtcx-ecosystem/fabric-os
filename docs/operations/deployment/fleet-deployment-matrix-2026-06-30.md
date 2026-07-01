---
title: 'Fleet deployment matrix'
status: current
date: 2026-06-30
owner: fabric-os
document_type: report
tier: critical
tags: ['deployment', 'codebuild', 'argocd', 'fleet', 'github-actions']
review_cycle: on-change
authority_class: R
supersedes: []
---

# Fleet deployment matrix

## Scope

This report records the current per-repo deployment posture under the Fabric OS
deployment contract.

System of record:

- Contract: `machine/spec/deployment-ops-contract.json`
- Fleet matrix spec: `machine/spec/deployment-fleet-matrix.json`
- Latest witness: `audit/evidence/deployment-fleet-matrix-latest.json`
- Scoring command: `pnpm deployment:fleet:matrix:write`

GitHub remains source control and review only for production deployment. Runtime
execution is AWS CodeBuild in `af-south-1`; Kubernetes delivery is Argo CD in
EKS. GCP remains limited to the GTCX Intelligence / Bridge ML artifact bridge.

## Current Score

| Area                      |                       Score | Evidence                                                    |
| ------------------------- | --------------------------: | ----------------------------------------------------------- |
| Fleet deployment matrix   |                     100/100 | `pnpm deployment:fleet:matrix:write`                        |
| Global Fabric substrate   |                     100/100 | CodeBuild, Argo CD, deployment contract, evidence witnesses |
| Repo average              |                     100/100 | 20 repo matrix entries                                      |
| Repos at benchmark        |                       20/20 | `audit/evidence/deployment-fleet-matrix-latest.json`        |
| Deployment CLI guardrails | 9/9 assertions at benchmark | `pnpm deployment:ops:test`                                  |

## Repo Scores

| Repo             | Role                    |   Score | Deployment posture                                                      |
| ---------------- | ----------------------- | ------: | ----------------------------------------------------------------------- |
| `fabric-os`      | fabric-control-plane    | 100/100 | Fabric substrate at benchmark. Legacy GitHub cluster execution retired. |
| `bridge-os`      | runtime-consumer        | 100/100 | Intelligence runtime source owner; Fabric owns manifests.               |
| `canon-os`       | governance-no-runtime   | 100/100 | No runtime deploy obligation.                                           |
| `baseline-os`    | governance-no-runtime   | 100/100 | Cost-router/model-routing owner; no runtime deploy obligation.          |
| `agile-os`       | governance-no-runtime   | 100/100 | No runtime deploy obligation.                                           |
| `ecosystem-os`   | governance-no-runtime   | 100/100 | No runtime deploy obligation.                                           |
| `gtcx-os`        | static-artifact         | 100/100 | Static artifact deployment profile at benchmark.                        |
| `markets-os`     | runtime-service         | 100/100 | Fabric staging manifest and repo signals at benchmark.                  |
| `terra-os`       | runtime-service         | 100/100 | Fabric manifests and repo signals at benchmark.                         |
| `sensei-os`      | runtime-service         | 100/100 | Fabric manifests and repo signals at benchmark.                         |
| `griot-ai`       | runtime-service         | 100/100 | Fabric staging manifest and live HTTPS evidence at benchmark.           |
| `nyota-ai`       | runtime-service         | 100/100 | Fabric manifests and repo signals at benchmark.                         |
| `veritas-ai`     | static-artifact         | 100/100 | Static artifact deployment profile at benchmark.                        |
| `venture-os`     | runtime-service         | 100/100 | Fabric staging manifest and repo signals at benchmark.                  |
| `ledger-os`      | profile-managed-runtime | 100/100 | Profile-managed runtime posture at benchmark.                           |
| `ledger-ui`      | static-artifact         | 100/100 | Static artifact deployment profile at benchmark.                        |
| `inspection-os`  | profile-managed-runtime | 100/100 | Profile-managed runtime posture at benchmark.                           |
| `terminal-os`    | runtime-service         | 100/100 | Fabric staging/production manifests and repo signals at benchmark.      |
| `exploration-os` | static-artifact         | 100/100 | Static artifact deployment profile at benchmark.                        |
| `compliance-os`  | runtime-service         | 100/100 | Fabric manifests and repo signals at benchmark.                         |

## Required Remediation

No required remediation remains in the current matrix. Re-run
`pnpm deployment:fleet:matrix:write` after each repo deployment-profile or
manifest change, and use `pnpm deployment:fleet:matrix:strict` to enforce the
100/100 benchmark.

## Source-Aligned CodeBuild Verification

The source-aligned CodeBuild retry is complete. Staging plan build
`gtcx-staging-deploy-executor:b9ed9c77-b08f-4bf4-a401-79c8d03bdcb1` ran against
source `2b39fc32dc24d72d5fdc0455a201ef8b1043a9f1` after the flow-log ownership
decomposition and completed successfully.

CloudWatch runner evidence shows Terraform `No changes`; the JSON plan summary
reported `changeCount: 0` and `changes: []`. Staging plan mode remains Class R.
Terraform apply and production Argo CD sync remain Class A.
