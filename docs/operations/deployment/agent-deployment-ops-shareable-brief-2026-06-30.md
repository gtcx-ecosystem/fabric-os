---
title: 'Agent deployment ops shareable brief'
status: current
date: 2026-06-30
owner: fabric-os
document_type: handoff
tier: critical
tags: ['deployment', 'ci', 'finops', 'agent']
authority_class: R
review_cycle: on-change
---

# Agent Deployment Ops Handoff (share this)

## Decision summary

- **GitHub is still the source-control platform.**
- **GitHub Actions is not in the production critical path** while the billing lock remains.
- **Production CI/deploy execution uses AWS** `CodeBuild` in-VPC, with `aws-codepipeline` / EventBridge orchestration.
- **Kubernetes delivery in production is Argo CD inside EKS** (initially manual sync).
- **Runtime cloud remains AWS** `af-south-1`.
- **GCP remains limited to the Intelligence bridge** (`intelligence runtime consumer` is the Bridge runtime consumer in this strategy).

## CI strategy question answered

Do not migrate to GitLab/Jenkins/Azure DevOps for this stage. The block is not SCM choice; it is a billing-plus-private-network execution path issue. AWS CodeBuild + Argo CD removes both with lower migration risk.

## Key operational docs (absolute paths)

- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/docs/operations/deployment/agent-deployment-ops-instructions-2026-06-30.md`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/docs/operations/deployment/infra-ai-cost-strategy-2026-06-30.md`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/docs/operations/deployment/github-billing-independent-deploy-handoff-2026-06-30.md`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/docs/operations/platform-services/devops-as-a-service.md`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/docs/operations/runbooks/finops-as-a-service.md`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/docs/operations/runbooks/github-actions-cost-controls.md`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/machine/spec/deployment-ops-contract.json`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/deploy/codebuild/README.md`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/deploy/codebuild/deploy-buildspec.yml`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/platform/scripts/codebuild-deploy-start.mjs`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/platform/scripts/codebuild-deploy-runner.mjs`

## Key evidence artifacts (absolute paths)

- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/audit/evidence/codebuild-deploy-start-latest.json`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/audit/evidence/codebuild-deploy-runner-latest.json`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/audit/evidence/mlops-cost-router-staging-probe-latest.json`
- `/Users/amanianai/Sites/gtcx-ecosystem/fabric-os/audit/deployment-open-items-audit-2026-06-30.md`

## Open-items state (as of 2026-06-30)

1. `F-INFRA-001` credential-injected (`griot-staging.gtcx.trade` ACM path) — mirror token into `gtcx/staging/cloudflare-dns-api-token` and use `--secret-env`.
2. `F-INFRA-002` runner-runtime issue mostly fixed — the last failed run used `origin/main` source without new buildspec path; rerun against pushed commit/source-version.
3. `F-INFRA-004` to `F-INFRA-007` remain execution follow-through in environment reconciliation and executor/Argo path.
4. `F-INFRA-009` and `F-INFRA-010` are owner-repo cleanup tickets outside this repo.

## Immediate commands to continue

```bash
pnpm operations:check
pnpm agent:next-work
pnpm deployment:ops:test
pnpm deployment:ops:contract:check
pnpm docs:operations:check
```

Live staging plan:

```bash
pnpm deployment:codebuild:start -- --environment=staging --mode=plan --secret-env=CLOUDFLARE_API_TOKEN=gtcx/staging/cloudflare-dns-api-token --write
```

If execution still fails, capture:

- build id
- `aws codebuild batch-get-builds`
- `aws logs get-log-events`

## Cost and AI ownership quick rule

- AWS cost-control execution is fabric-os.
- Model routing/pricing policy is baseline-os cost-router.
- GTCX Intelligence / Bridge consumes the runtime contract and evidence outputs.
