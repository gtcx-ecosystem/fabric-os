---
title: 'GitHub billing independent deployment handoff'
status: proposed
date: 2026-06-30
owner: fabric-os
document_type: handoff
tier: critical
tags: ['deployment', 'ci-cd', 'github-actions', 'aws', 'gitops']
review_cycle: on-change
authority_class: A
---

# GitHub billing independent deployment handoff

## Decision

Keep GitHub as the source-control and review system. Do not make GitHub Actions
the critical production deployment executor while the organization has an
unresolved billing lock.

Move production deploy execution to an AWS-owned path:

1. **Immediate executor:** AWS CodeBuild project inside the production VPC.
2. **Steady-state Kubernetes delivery:** Argo CD inside EKS, pulling signed
   manifests from Git.
3. **Fallback only:** GitHub self-hosted runner inside the VPC if Actions can
   still schedule self-hosted jobs under the current billing state.

Do not migrate the fleet to GitLab, Jenkins, Azure DevOps, or another
enterprise DevOps suite in this phase. That would move the bottleneck and add a
large migration burden without solving the private EKS access requirement.

## Rationale

- Current repo policy places runtime infrastructure on AWS `af-south-1`.
- GCP is only in scope for the GTCX Intelligence / Bridge Phase 3 ML bridge.
- Production EKS defaults to a private API endpoint.
- GitHub Actions billing is externally blocked and may not be resolved quickly.
- Self-hosted GitHub runners avoid GitHub-hosted runner minutes, but they still
  require GitHub Actions scheduling to work.
- AWS CodeBuild can run with VPC configuration and reach private AWS resources.
- Argo CD reduces CI/CD coupling because deploy state is reconciled from Git by
  a controller already running inside Kubernetes.

## Target architecture

```text
Developer PR
  -> GitHub review and merge
  -> Image build and manifest update
     -> CodeBuild in AWS VPC
        -> Terraform plan/apply for infra changes
        -> kustomize/helm validation for app changes
        -> publish evidence to S3/WORM
     -> Argo CD in EKS
        -> pulls pinned Git commit or signed manifest tag
        -> applies to private production cluster
        -> records sync, health, rollback state
```

## Platform decision

| Platform                      | Decision                       | Why                                                                                                            |
| ----------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| GitHub                        | Keep                           | Best current SCM/review fit; migration risk is not justified.                                                  |
| GitHub Actions hosted runners | Remove from prod critical path | Billing lock and no private EKS reachability.                                                                  |
| GitHub self-hosted runners    | Conditional fallback           | Useful only if Actions scheduling still works.                                                                 |
| AWS CodeBuild                 | Adopt now                      | Runs in AWS account, can be VPC-attached, can assume IAM roles, and does not depend on GitHub Actions minutes. |
| Argo CD                       | Adopt for EKS delivery         | In-cluster reconciliation avoids exposing private EKS API to external CI.                                      |
| GitLab/Jenkins/Azure DevOps   | Do not migrate now             | Higher migration cost, new admin surface, and still needs a private network executor.                          |
| GCP                           | Keep limited                   | GTCX Intelligence / Bridge ML bridge only until cloud placement SoR changes.                                   |

## Phases

### Phase 0: Verify GitHub self-hosted viability

Run one no-op workflow on a self-hosted label. If GitHub refuses to schedule it
because of the billing lock, close this path and do not invest in ARC or
self-hosted GitHub runner scale sets.

Exit criteria:

- `self-hosted` no-op job either schedules successfully or fails with a billing
  reason.
- Result is recorded under `audit/evidence/`.

### Phase 1: Stand up AWS CodeBuild deploy executor

Create the Terraform-backed `gtcx-<environment>-deploy-executor` CodeBuild
project with:

- VPC subnets that can reach the private EKS API.
- Security group with no inbound rules.
- IAM role scoped to EKS describe, Kubernetes deploy path, ECR read/write,
  S3/WORM evidence writes, Secrets Manager reads for deploy-only secrets, and
  Terraform state access.
- Terraform module:
  `deploy/terraform/modules/codebuild-deploy-executor/`
- Buildspec:
  `deploy/codebuild/deploy-buildspec.yml`
- Runner:
  `pnpm deployment:codebuild:runner -- --environment=staging --mode=plan --write`
- Start wrapper:
  `pnpm deployment:codebuild:start -- --environment=staging --mode=plan --write`
- Local guardrail tests:
  `pnpm deployment:ops:test`
- Buildspec entrypoints:
  - `pnpm operations:check`
  - `pnpm gha:cost-controls:check`
  - `terraform -chdir=deploy/terraform/environments/production plan -out=tfplan`
  - approved apply command for Class A deploys
  - `kubectl apply -k deploy/kubernetes/overlays/production`
  - rollout and health probes
  - evidence bundle upload

Exit criteria:

- CodeBuild can reach the private EKS API.
- Dry-run plan and `kubectl auth can-i` evidence are stored.
- No GitHub Actions minutes are needed for the deployment path.
- Evidence artifact:
  `audit/evidence/codebuild-deploy-runner-latest.json`.

### Phase 2: Install Argo CD for production EKS

Install Argo CD in-cluster. Staging is the first proof point via:

- Terraform module: `deploy/terraform/modules/argocd/`
- Staging Application: `fabric-staging-root`
- Source path: `deploy/kubernetes/overlays/staging`

Production follows after staging sync and health evidence. Required properties:

- SSO/RBAC limited to platform operators.
- Private repo deploy key or GitHub App auth.
- One application per product namespace or bounded service group.
- Manual sync for production initially.
- Sync windows and rollback process documented.
- GnuPG or signature verification for production manifest source.

Exit criteria:

- Argo CD reports production applications as `Synced` and `Healthy`.
- Manual sync from a pinned commit works.
- Rollback to a previous commit is tested.

### Phase 3: Convert fleet deploys to GitOps

Owner repos continue to own source code and images. Fabric-os owns manifests,
ingress, secrets substrate, WAF, RDS, S3/WORM, and production deploy evidence.

Flow:

1. Owner repo publishes image digest.
2. Fabric-os updates production manifest to the immutable digest.
3. CodeBuild runs checks and writes evidence.
4. Argo CD syncs the approved manifest commit.
5. Product smoke results are linked back to the owner repo.

Exit criteria:

- Production deploys are reproducible from Git commit plus image digest.
- No production apply requires a laptop or public EKS API endpoint.
- GitHub Actions can be disabled for production deploys without changing the
  release process.

## Ownership

| Owner          | Responsibilities                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| fabric-os      | AWS deploy executor, EKS access, Argo CD, Terraform, WAF, SM/ESO, RDS, S3/WORM, deploy evidence.      |
| owner repos    | Source code, tests, image build, app smoke, business logic readiness.                                 |
| bridge-os      | Coordination, vault SoR, fleet reporting.                                                             |
| canon-os       | Cloud placement and governance SoR.                                                                   |
| human operator | Class A production apply approval, billing/account unlock if still desired, vendor/account contracts. |

## Enterprise-stack answer

GitHub is still optimal for source control and review. GitHub Actions is not
optimal as the production executor for this environment.

The enterprise stack should be:

- GitHub for SCM and PR workflow.
- AWS CodeBuild for billing-independent, VPC-attached execution.
- Argo CD for Kubernetes continuous delivery.
- AWS IAM/OIDC/Secrets Manager/S3 Object Lock for security and evidence.
- GCP only for the approved intelligence ML bridge.

Revisit a full platform migration only if one of these becomes true:

- GitHub org billing/account governance remains unresolved for source-control
  operations, not just Actions.
- A customer or regulator requires a single-vendor enterprise DevSecOps suite.
- GitHub availability or account administration becomes a repeated release
  blocker.
- The team is willing to fund a migration program across every repo, CI secret,
  branch policy, package registry, and release witness.

## First implementation stories

1. `FAB-DEPLOY-001`: Add Terraform module for production CodeBuild deploy
   executor.
2. `FAB-DEPLOY-002`: Add buildspec and deploy wrapper that writes evidence.
3. `FAB-DEPLOY-003`: Add no-op self-hosted GitHub scheduling probe and evidence.
4. `FAB-DEPLOY-004`: Install Argo CD in staging, then production.
5. `FAB-DEPLOY-005`: Convert one low-risk service to Argo CD manual sync.
6. `FAB-DEPLOY-006`: Convert production manifests to immutable image digests.

## External references

- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- GitHub self-hosted runners: https://docs.github.com/en/actions/concepts/runners/self-hosted-runners
- AWS CodeBuild VPC support: https://docs.aws.amazon.com/codebuild/latest/userguide/vpc-support.html
- Argo CD overview: https://argo-cd.readthedocs.io/en/stable/
- Argo CD automated sync: https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/
