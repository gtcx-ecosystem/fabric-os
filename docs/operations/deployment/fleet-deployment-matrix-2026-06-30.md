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
| Fleet deployment matrix   |                      97/100 | `pnpm deployment:fleet:matrix:write`                        |
| Global Fabric substrate   |                     100/100 | CodeBuild, Argo CD, deployment contract, evidence witnesses |
| Repo average              |                      93/100 | 20 repo matrix entries                                      |
| Repos at benchmark        |                       10/20 | `audit/evidence/deployment-fleet-matrix-latest.json`        |
| Deployment CLI guardrails | 9/9 assertions at benchmark | `pnpm deployment:ops:test`                                  |

## Repo Scores

| Repo             | Role                  |   Score | Deployment posture                                                      |
| ---------------- | --------------------- | ------: | ----------------------------------------------------------------------- |
| `fabric-os`      | fabric-control-plane  | 100/100 | Fabric substrate at benchmark. Legacy GitHub cluster execution retired. |
| `bridge-os`      | runtime-consumer      | 100/100 | Intelligence runtime source owner; Fabric owns manifests.               |
| `canon-os`       | governance-no-runtime | 100/100 | No runtime deploy obligation.                                           |
| `baseline-os`    | governance-no-runtime | 100/100 | Cost-router/model-routing owner; no runtime deploy obligation.          |
| `agile-os`       | governance-no-runtime | 100/100 | No runtime deploy obligation.                                           |
| `ecosystem-os`   | governance-no-runtime | 100/100 | No runtime deploy obligation.                                           |
| `gtcx-os`        | static-artifact       |  78/100 | Retired infra alias and GitHub production deploy workflow remain.       |
| `markets-os`     | runtime-service       | 100/100 | Fabric staging manifest and repo signals at benchmark.                  |
| `terra-os`       | runtime-service       |  82/100 | Retired infra alias and GitHub deploy workflows remain.                 |
| `sensei-os`      | runtime-service       |  82/100 | Retired infra alias and GitHub cluster workflows remain.                |
| `griot-ai`       | runtime-service       | 100/100 | Fabric staging manifest and live HTTPS evidence at benchmark.           |
| `nyota-ai`       | runtime-service       |  88/100 | GitHub production deploy workflow remains.                              |
| `veritas-ai`     | runtime-service       |  86/100 | Missing Fabric manifest declaration.                                    |
| `venture-os`     | runtime-service       | 100/100 | Fabric staging manifest and repo signals at benchmark.                  |
| `ledger-os`      | runtime-service       |  90/100 | Missing Fabric manifest declaration.                                    |
| `ledger-ui`      | static-artifact       |  89/100 | Retired infra alias remains.                                            |
| `inspection-os`  | runtime-service       |  90/100 | Missing Fabric manifest declaration.                                    |
| `terminal-os`    | runtime-service       | 100/100 | Fabric staging/production manifests and repo signals at benchmark.      |
| `exploration-os` | static-artifact       |  89/100 | Retired infra alias remains.                                            |
| `compliance-os`  | runtime-service       |  92/100 | Retired infra alias remains.                                            |

## Required Remediation

1. Remove retired `gtcx-infrastructure` handoff aliases from repo-local
   deployment profiles. Route deployment handoffs to `fabric-os`.
2. Retire product repo GitHub Actions workflows that execute production deploy,
   `kubectl`, `argocd`, or EKS access. Use Fabric CodeBuild / Argo CD instead.
3. For `veritas-ai`, `ledger-os`, and `inspection-os`, either add Fabric-owned
   manifest paths or reclassify them with an explicit non-Kubernetes deployment
   profile.
4. Re-run `pnpm deployment:fleet:matrix:write` after each repo remediation.
5. Use `pnpm deployment:fleet:matrix:strict` only when the fleet is expected to
   be at 100/100.

## Source-Aligned CodeBuild Retry

The latest live CodeBuild staging plan succeeded against source version
`3fe91998568a583d9ca90594d19e0d189e04aae3`, not the current Fabric head. Before
claiming final executor validation on the current deployment matrix, push or
merge the current Fabric deployment changes and re-run:

```bash
pnpm deployment:codebuild:start -- --environment=staging --mode=plan --source-version=<pushed-commit> --secret-env=CLOUDFLARE_API_TOKEN=gtcx/staging/cloudflare-dns-api-token --write --execute
```

This is Class R for staging plan mode. Terraform apply and production Argo CD
sync remain Class A.
