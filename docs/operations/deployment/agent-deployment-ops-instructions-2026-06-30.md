---
title: 'Agent deployment ops instructions'
status: current
date: 2026-06-30
owner: fabric-os
document_type: runbook
tier: critical
tags: ['deployment', 'ci', 'agents', 'aws', 'argocd', 'finops']
review_cycle: on-change
authority_class: R
---

# Agent deployment ops instructions

## Purpose

This is the agent operating instruction for deployment, CI, intelligence
runtime, and cost-control work after the GitHub Actions billing constraint.

Read this before changing CI, deployment, Terraform, Kubernetes, cost gates, or
GTCX Intelligence / Bridge runtime wiring.

## Authority and ownership

| Area                       | Owner                                   | Agent posture                                           |
| -------------------------- | --------------------------------------- | ------------------------------------------------------- |
| Infra strategy             | fabric-os + baseline-os                 | Follow this repo strategy; do not invent a new owner.   |
| Runtime cloud              | fabric-os                               | AWS `af-south-1` by default.                            |
| CI executor                | fabric-os                               | AWS CodeBuild / CodePipeline path.                      |
| Kubernetes delivery        | fabric-os                               | Argo CD in EKS, initially manual sync.                  |
| AI model routing           | baseline-os                             | Use cost-router and CostGuard contracts.                |
| Deploy evidence            | fabric-os                               | Write redacted evidence and WORM artifacts.             |
| GTCX Intelligence / Bridge | Bridge intelligence runtime consumer    | Consumes runtime contract; does not own infra strategy. |
| GCP                        | GTCX Intelligence / Bridge Phase 3 only | Artifact bridge only until SoR changes.                 |

## Non-negotiable decisions

1. Do not make GitHub Actions the production CI/deploy control plane while the
   billing lock is unresolved.
2. Do not reopen the production EKS API publicly to compensate for CI access.
3. Do not migrate SCM or CI to GitLab, Jenkins, Azure DevOps, CircleCI, or
   Buildkite unless a new Class A strategy supersedes this document.
4. Do not deploy every repo to both AWS and GCP. Runtime stays on AWS; GCP is
   the approved intelligence ML artifact bridge only.
5. Do not allow product repos to fork AI pricing, model routing, or cost policy.
6. Do not claim intelligence cost-router readiness until the live pod imports
   `baselineos/cost-router` successfully.

## Current strategy

Use this stack:

| Layer                  | Standard                                                               |
| ---------------------- | ---------------------------------------------------------------------- |
| Source control         | GitHub                                                                 |
| CI execution           | AWS CodeBuild, on demand                                               |
| Pipeline orchestration | AWS CodePipeline or EventBridge-triggered CodeBuild                    |
| Kubernetes delivery    | Argo CD inside EKS                                                     |
| Runtime                | AWS `af-south-1`                                                       |
| Secrets                | AWS Secrets Manager + External Secrets Operator + Baseline vault split |
| Evidence               | S3 Object Lock / WORM + fabric-os witnesses                            |
| AI routing             | baseline-os cost-router + CostGuard                                    |
| Cost evidence          | fabric-os FinOps witnesses, consuming current cost witness inputs      |

## Agent workflow

### 1. Start with repo gates

Always run:

```bash
pnpm operations:check
pnpm agent:next-work
```

For deployment or CI docs, also run:

```bash
pnpm docs:operations:check
pnpm deployment:ops:contract:check
pnpm deployment:ops:test
```

For cost changes, run or update the applicable FinOps witness:

```bash
pnpm finops:check
pnpm infra:cost:audit:write
```

If AWS credentials or Cost Explorer access are unavailable, emit a Permission
Unblock Report. Do not tell the operator to run commands manually.

### 2. Classify the work

| Work                                       | Class                           |
| ------------------------------------------ | ------------------------------- |
| Docs, strategy, checks, dry-run gates      | R                               |
| CodeBuild/Argo CD Terraform apply          | A                               |
| Production Kubernetes sync/apply           | A                               |
| Production EKS public API reopening        | Not allowed under this strategy |
| Legal, contract, billing account decisions | S                               |

Class R work should be executed in-session. Class A work needs the approved
artifact or operator authorization. Class S work stops with a blocker report.

### 3. CI implementation path

Use CodeBuild first.

Required properties:

- CodeBuild project runs in the target AWS account.
- Production deploy project is VPC-attached and can reach private EKS.
- Terraform module is
  `deploy/terraform/modules/codebuild-deploy-executor/`.
- Buildspec is `deploy/codebuild/deploy-buildspec.yml`.
- Deployment runner is
  `pnpm deployment:codebuild:runner -- --environment=staging --mode=plan --write`.
- Dry-run/start wrapper is
  `pnpm deployment:codebuild:start -- --environment=staging --mode=plan --write`.
- No inbound security group rules.
- IAM role is least-privilege for EKS, ECR, S3/WORM, Terraform state, and
  required Secrets Manager reads.
- Buildspec runs cheap gates before expensive work.
- Buildspec writes evidence under `audit/evidence/` or configured WORM path.
- Artifacts have lifecycle expiration unless they are audit evidence.

Avoid always-on self-hosted runners until measured CodeBuild spend exceeds the
idle runner break-even.

For `terraform-apply`, or production `argocd-sync`, pass
`--class-a-ref=<artifact>`. The wrapper and runner reject those modes without
that Class A reference.

### 4. Deployment implementation path

Use Argo CD for Kubernetes delivery.

Required properties:

- Argo CD runs inside EKS.
- Terraform module is `deploy/terraform/modules/argocd/`.
- Staging proof app is `fabric-staging-root`, pointed at
  `deploy/kubernetes/overlays/staging`.
- Production sync starts manual.
- Applications point at pinned Git commits or immutable image digests.
- Rollback is by prior Git commit or prior image digest.
- Sync and health evidence is captured before marking deploy complete.

CI should validate and publish desired state. Argo CD should apply desired state
from inside the cluster boundary.

### 5. Cost-control path

Treat cost as a release gate.

Required checks:

- Fleet projected monthly spend.
- Production projected monthly spend.
- Nonproduction projected monthly spend.
- EKS share.
- NAT/VPC share.
- RDS share.
- Cost per deploy.
- Warm idle hours.

Optimization order:

1. Enforce nonprod cold defaults.
2. Add VPC endpoints and reduce NAT dependency.
3. Right-size EKS nodes and node groups.
4. Move non-critical compute to Spot where safe.
5. Right-size RDS and retention.
6. Reduce CloudWatch retention for non-audit logs.
7. Move static surfaces out of EKS where approved.
8. Add AI cost routing/caching/batch only after durable usage telemetry exists.

### 6. Intelligence / AI path

GTCX Intelligence / Bridge is the runtime consumer. The infra strategy remains
fabric-os + baseline-os.

Immediate blocker:

- `audit/evidence/mlops-cost-router-staging-probe-latest.json` is `FAIL`.
- The live pod reports `ENABLE_COST_ROUTER=1` but cannot import
  `baselineos/cost-router`.

Required remediation:

1. GTCX Intelligence / Bridge rebuilds the SDK image with baseline-os
   cost-router available.
2. fabric-os updates the staging deployment image digest.
3. Rollout completes in the `intelligence` namespace.
4. `pnpm mlops:cost-router-staging-probe:write` passes.

Do not claim AI cost readiness before this passes.

### 7. GCP path

Only enable GCP when the Phase 3 bridge prerequisites exist:

- GCP project exists.
- `intelligence-ml` service account exists.
- `gcp_service_account_unique_id` is known.
- AWS `ml-pipeline` module is applied.
- `deploy/terraform/modules/gcp-ml-bridge/` is enabled.

The bridge writes model artifacts only. It is not a general GCP runtime
migration.

## Required handoff references

- `docs/operations/deployment/infra-ai-cost-strategy-2026-06-30.md`
- `docs/operations/deployment/github-billing-independent-deploy-handoff-2026-06-30.md`
- `docs/operations/runbooks/github-actions-cost-controls.md`
- `docs/operations/runbooks/finops-as-a-service.md`
- `docs/operations/platform-services/devops-as-a-service.md`
- `machine/spec/mlops-bridge-contract.json`
- `audit/evidence/mlops-cost-router-staging-probe-latest.json`

## Closeout requirements

Before marking deployment ops work done:

1. Run applicable checks in-session.
2. Report commands and exit codes.
3. Link evidence paths.
4. State whether GitHub Actions was avoided for the critical path.
5. State whether any Class A/S approval remains.
6. Do not end with "run this locally" or "let me know if you want".
