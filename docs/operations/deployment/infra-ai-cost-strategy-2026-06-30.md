---
title: 'Infrastructure, intelligence, and AI cost strategy'
status: proposed
date: 2026-06-30
owner: fabric-os
document_type: strategy
tier: critical
tags: ['deployment', 'finops', 'aiops', 'mlops', 'intelligence', 'aws', 'gcp']
review_cycle: on-change
authority_class: A
---

# Infrastructure, intelligence, and AI cost strategy

## Executive decision

GTCX should keep GitHub for source control and review, but remove GitHub
Actions from the production critical path. The deployment and cost-control
spine should be AWS-owned:

- **SCM:** GitHub.
- **Production executor:** AWS CodeBuild running inside the production VPC.
- **Kubernetes delivery:** Argo CD inside EKS, initially manual sync.
- **Runtime cloud:** AWS `af-south-1` for fleet runtime.
- **GCP:** only GTCX Intelligence / Bridge Phase 3 ML artifact bridge.
- **Strategy ownership:** fabric-os + baseline-os.
- **AI routing and budget:** baseline-os cost-router/model governance +
  fabric-os deploy, cost, and evidence substrate.

Do not migrate to GitLab, Jenkins, Azure DevOps, or a new enterprise DevOps
suite now. The current release blocker is not GitHub source control; it is
GitHub Actions billing plus private EKS reachability. Moving CI vendors still
requires a private-network deploy executor and creates a cross-repo migration
program.

## Current facts

| Area              | Evidence                                                                                                             | Implication                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime placement | `AGENTS.md` and infra matrix: AWS `af-south-1`; GCP only ML bridge.                                                  | No broad AWS+GCP dual runtime.                                                                |
| Deployment        | Production EKS API is private; GitHub Actions billing is blocked.                                                    | Use in-VPC AWS executor.                                                                      |
| Cost              | Bridge-hosted cost witness `../bridge-os/machine/ci/aws-cost-weekly.json`: `$797.11/week`, `$3,416.19/mo` projected. | Fleet is above the `$1,500/mo` governance cap; fabric-os owns infra remediation.              |
| Cost drivers      | Weekly: EKS `$297`, RDS `$152.95`, VPC `$99.21`, EC2 `$76.14`, ELB `$36.85`, CloudWatch `$28.22`.                    | Optimize EKS/RDS/VPC first; AI is not the main current spend.                                 |
| Intelligence      | `audit/evidence/mlops-cost-router-staging-probe-latest.json` is `FAIL`.                                              | `ENABLE_COST_ROUTER=1` is not sufficient; pod cannot import `baselineos/cost-router`.         |
| MLOps ownership   | baseline-os owns cost-router/model governance; fabric-os owns deployment/cost/evidence substrate and this strategy.  | GTCX Intelligence / Bridge consumes the runtime contract; it does not own the infra strategy. |
| Nonprod controls  | `cost_profile`: staging scheduled, testnet ephemeral, production always-on.                                          | Enforce cold defaults and env warm approvals.                                                 |

## Target architecture

```text
GitHub PR / merge
  -> owner repo tests and image build
  -> immutable image digest published
  -> fabric-os manifest update
  -> AWS CodeBuild deploy executor in VPC
       - operations gates
       - Terraform plan/apply when approved
       - kustomize/helm validation
       - evidence bundle to S3/WORM
  -> Argo CD in EKS reconciles pinned manifest commit
  -> smoke probes and cost evidence

AI call path
  -> product/intelligence service
  -> baseline-os cost-router
  -> CostGuard tenant/repo budget
  -> provider/self-host/batch/cache route
  -> usage event + cost-stats
  -> baseline-os/fabric-os cost evidence
  -> fabric-os WORM evidence and dashboards
```

## Strategy pillars

### 1. Deployment independence

Implement the handoff in
`docs/operations/deployment/github-billing-independent-deploy-handoff-2026-06-30.md`.

Required moves:

- Add AWS CodeBuild deploy project with VPC subnets that can reach private EKS.
- Keep the CodeBuild security group inbound-empty.
- Trigger manually at first from AWS console/CLI, then from EventBridge or a
  minimal GitHub webhook when billing is unblocked.
- Install Argo CD in staging first, then production.
- Convert production manifests to immutable image digests.
- Keep production EKS private; do not reopen `0.0.0.0/0` API access.

Why: AWS CodeBuild supports VPC configuration for access to private resources,
and Argo CD moves Kubernetes apply work inside the cluster boundary.

### 2. AWS runtime cost reset

Target: bring projected monthly AWS spend from `$3,416` to `$1,200-1,500`
without reducing production resilience.

Immediate controls:

- Enforce nonprod `scheduled` and `ephemeral` profiles: staging/testnet nodes
  should cold to `desired=0` outside approved windows.
- Run the weekly cost report from its current witness location and fail
  fabric-os governance when projected spend is above cap without an explicit
  Class A waiver.
- Use AWS Cost Optimization Hub and Compute Optimizer exports as evidence, not
  console-only advice.
- Reduce VPC spend: prefer VPC endpoints for S3/ECR/Secrets/CloudWatch/STS and
  keep NAT gateways minimal.
- Reduce EKS/EC2 spend: right-size node groups, move burstable/non-critical
  workloads to Spot, and evaluate EKS Auto Mode or Karpenter for consolidation.
- Reduce RDS spend: right-size dev/staging, validate storage autoscaling, and
  avoid per-service DB instances where database-per-service on shared RDS is
  sufficient.
- Reduce CloudWatch/log spend: short retention for operational logs; WORM only
  for audit evidence.
- Move static/front-end surfaces to edge where already approved; do not run
  static marketing or docs surfaces on EKS.

Cost guardrails:

| Metric                       | Target      |
| ---------------------------- | ----------- |
| Fleet monthly projected      | `<= $1,500` |
| Production monthly projected | `<= $1,200` |
| Nonprod monthly projected    | `<= $400`   |
| NAT share                    | `< 12%`     |
| EKS share                    | `< 30%`     |
| Cost per deploy              | `< $15`     |
| Warm idle hours              | `< 12/week` |

### 3. Intelligence and MLOps

GTCX Intelligence is treated as the Bridge intelligence runtime consumer for
this strategy. Some local checkout paths and historical evidence still use
legacy aliases like `gtcx-os/platform/intelligence`; those are path aliases, not
strategy ownership.

Priority fix:

- Close `MOF-002`: rebuild the intelligence SDK image so the running pod can
  import `baselineos/cost-router`.
- Update `deploy/kubernetes/overlays/staging/intelligence/deployment.yaml` to
  the new digest.
- Re-run `pnpm mlops:cost-router-staging-probe:write`; it must pass before
  claiming cost-router production readiness.

Operating model:

- `baseline-os`: cost-router, model matrix, CostGuard, model governance.
- `fabric-os`: EKS, secrets substrate, observability, deploy evidence, FinOps
  execution, and this infra strategy.
- GTCX Intelligence / Bridge: service behavior, inference API consumption, app
  smoke, and ML artifact production when Phase 3 is approved.

Model routing rules:

- Default routine tasks to cheapest model that clears task capability.
- Reserve frontier/reasoning models for high-risk compliance, security, or
  code-generation paths.
- Use prompt caching for repeated system/context/tool prefixes.
- Use batch inference for asynchronous bulk jobs where no tool calling or
  structured output is required.
- Prefer self-host/open-weight only after measured volume justifies GPU
  operating cost.
- Do not fork pricing tables inside product repos.

### 4. GCP boundary

Do not move GTCX runtime to GCP in this phase.

Approved GCP use:

- Vertex/GCP ML owned by GTCX Intelligence / Bridge when Phase 3 starts.
- `fabric-os/deploy/terraform/modules/gcp-ml-bridge/` creates AWS-side IAM for
  GCP Workload Identity Federation.
- GCP writes model artifacts only to existing AWS ML pipeline S3/DynamoDB.

Blocked until:

- GCP project and `intelligence-ml` service account exist.
- `gcp_service_account_unique_id` is known.
- AWS `ml-pipeline` module is already applied.
- Cloud placement SoR is updated if scope expands beyond artifact bridge.

### 5. Observability and evidence

Add a single "Fleet Cost and AI Spend" evidence loop:

- AWS spend: current cost witness `aws-cost-weekly.json`, consumed by fabric-os
  for remediation.
- AI spend: baseline-os `cost-stats` once durable.
- Runtime health: fabric-os fleet health and intelligence dashboards.
- Deployment evidence: CodeBuild logs + release evidence bundle + WORM upload.
- Optimization evidence: Cost Optimization Hub and Compute Optimizer exports.

Required dashboard panels:

- AWS projected monthly spend by service.
- Budget burn by environment.
- EKS node hours by environment and namespace.
- NAT gateway bytes and spend.
- RDS instance/storage spend.
- LLM spend by repo/tenant/model/provider.
- Cost-router route distribution.
- Cache hit rate and batch job savings.
- Cost per deploy and warm idle hours.

## 30 / 60 / 90 day plan

### First 30 days

1. Stand up CodeBuild deploy executor in staging and production VPCs.
2. Prove private EKS access from CodeBuild with `kubectl auth can-i`.
3. Close `MOF-002` in intelligence cost-router staging probe.
4. Enforce nonprod cold defaults and record weekly cost witness.
5. Export Cost Optimization Hub and Compute Optimizer recommendations.
6. Install Argo CD in staging with manual sync.

### Days 31-60

1. Move one low-risk service to Argo CD manual sync.
2. Convert production manifests to immutable image digests.
3. Add durable `cost-stats` and per-repo `tenantId`/`aiBudget` mapping.
4. Wire AI usage events into baseline-os/fabric-os cost evidence.
5. Add VPC endpoints for high-traffic AWS services where absent.
6. Evaluate Karpenter or EKS Auto Mode for staging before production.

### Days 61-90

1. Move production Kubernetes delivery to Argo CD manual sync.
2. Add progressive sync/rollback runbook.
3. Enforce budget gates in release evidence.
4. Add prompt caching and batch inference paths for intelligence workloads.
5. Decide whether GCP ML bridge enters Phase 3.
6. Re-baseline AWS spend and commit a measured reduction report.

## Implementation stories

| ID               | Owner                      | Story                                   | Acceptance                                                                                                                                                |
| ---------------- | -------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FAB-INFRA-001`  | fabric-os                  | Terraform CodeBuild VPC deploy executor | Module `deploy/terraform/modules/codebuild-deploy-executor/` wired to staging/production; start wrapper `pnpm deployment:codebuild:start` emits evidence. |
| `FAB-DEPLOY-002` | fabric-os                  | CodeBuild buildspec and deploy runner   | `deploy/codebuild/deploy-buildspec.yml` runs `platform/scripts/codebuild-deploy-runner.mjs` and writes deploy evidence.                                   |
| `FAB-INFRA-002`  | fabric-os                  | Argo CD staging install                 | Module `deploy/terraform/modules/argocd/` wired to staging; `fabric-staging-root` manual-sync app declared.                                               |
| `FAB-INFRA-003`  | fabric-os                  | Cost Optimization Hub export witness    | `pnpm finops:aws-optimization:export:write` stores planned or executed recommendations export under `audit/evidence/`.                                    |
| `FAB-INFRA-004`  | fabric-os                  | VPC endpoint/NAT reduction plan         | NAT share reported and reduction plan linked.                                                                                                             |
| `INT-AI-001`     | GTCX Intelligence / Bridge | Rebuild SDK with baselineos cost-router | `mlops-cost-router-staging-probe` passes.                                                                                                                 |
| `BASE-AI-001`    | baseline-os                | Durable cost-stats by tenant/repo/model | `baseline cost-stats --json` produces persisted spend.                                                                                                    |
| `FAB-AI-002`     | fabric-os + baseline-os    | Per-repo AI budget governance           | 15 repo profiles include `tenantId` and `aiBudget`, with runtime enforcement through baseline-os.                                                         |
| `FAB-AI-001`     | fabric-os                  | Fleet Cost and AI Spend dashboard       | AWS + AI spend panels linked from FinOps witness.                                                                                                         |
| `INT-GCP-001`    | GTCX Intelligence / Bridge | Phase 3 GCP ML bridge readiness         | GCP SA id available and AWS bridge module enabled.                                                                                                        |

## External references

- AWS CodeBuild VPC support:
  `https://docs.aws.amazon.com/codebuild/latest/userguide/vpc-support.html`
- AWS EKS Auto Mode:
  `https://docs.aws.amazon.com/eks/latest/userguide/automode.html`
- AWS EKS cost optimization:
  `https://docs.aws.amazon.com/eks/latest/best-practices/cost-opt.html`
- AWS Cost Optimization Hub:
  `https://docs.aws.amazon.com/cost-management/latest/userguide/cost-optimization-hub.html`
- AWS Compute Optimizer:
  `https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html`
- Amazon Bedrock prompt caching:
  `https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html`
- Amazon Bedrock batch inference:
  `https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference.html`
- Argo CD:
  `https://argo-cd.readthedocs.io/en/stable/`
