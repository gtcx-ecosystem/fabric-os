---
title: 'GitHub Actions cost controls'
status: current
date: 2026-06-30
owner: fabric-os
tier: operating
tags: ['runbook', 'github-actions', 'cost-controls', 'finops']
review_cycle: on-change
document_type: runbook
---

# GitHub Actions cost controls

## Purpose

GitHub Actions spend is a fleet operations risk. Fabric-os owns the minimum
policy that keeps recurring automation useful without allowing runner minutes
to compound unnoticed.

GitHub Actions is **not** the production CI/deploy control plane while the
organization billing lock remains unresolved. Production-critical CI execution
uses AWS CodeBuild; Kubernetes delivery uses Argo CD inside EKS.

Machine contract: [`machine/spec/deployment-ops-contract.json`](../../../machine/spec/deployment-ops-contract.json).

## Policy floor

| Control             | Requirement                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Runner class        | Default to `ubuntu-latest`.                                                                                |
| macOS runners       | Forbidden unless a current iOS/macOS build requirement, budget owner, approval, and expiry are documented. |
| Scheduled workflows | Must declare `concurrency` with `cancel-in-progress: true`.                                                |
| Job runtime         | Every scheduled workflow job must declare `timeout-minutes`.                                               |
| Matrix jobs         | Keep matrix dimensions explicit and capped; no open-ended fleet fan-out without approval.                  |
| Retired platforms   | Vercel is retired; no deployment or status-check should depend on it.                                      |
| Production CI/CD    | GitHub Actions is source-control event plumbing only; CodeBuild + Argo CD is the production path.          |

## Current fabric-os remediation

The recurring fabric-os workflows now have explicit cancellation and timeouts:

- `aaas-cadence.yml`
- `aaas-loop.yml`
- `chaos-test.yml`
- `cross-repo-health.yml`
- `dast-zap.yml`
- `distribution-snapshot.yml`
- `dr-test.yml`
- `dr-test-quarterly.yml`
- `injection-suite-weekly.yml`
- `markets-os-staging-chain-verify.yml`

## Verification

Run:

```bash
pnpm gha:cost-controls:check
```

The checker enforces:

- no disallowed runner classes in workflow files;
- no Vercel references in workflow files;
- scheduled workflows have top-level concurrency;
- scheduled workflow concurrency uses `cancel-in-progress: true`;
- scheduled workflow jobs have `timeout-minutes`.

## Fleet guidance

Apply the same policy to owner repos before launching broad automation waves.
High-frequency schedules and macOS runners require explicit budget review before
enablement.

Do not add new production deploy jobs to GitHub Actions. If a workflow is needed
as a temporary trigger, it must hand off to the AWS-owned executor and remain
outside the production critical path.
