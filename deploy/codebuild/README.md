# CodeBuild Deploy Executor

This folder contains the AWS-owned deployment execution path for Fabric OS.
GitHub is used as SCM input only; GitHub Actions is not the production deploy
executor while the billing lock is unresolved.

## Files

| File                   | Purpose                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `deploy-buildspec.yml` | CodeBuild buildspec used by staging and production deploy executor projects. |

## Local Commands

```bash
pnpm deployment:ops:test
pnpm deployment:codebuild:runner -- --environment=staging --mode=plan --write
pnpm deployment:codebuild:start -- --environment=staging --mode=plan --write
```

## Live Execution

Live AWS execution requires the Terraform-provisioned CodeBuild project:

- `gtcx-staging-deploy-executor`
- `gtcx-production-deploy-executor`

Use `--execute` only in a credentialed session. `terraform-apply`, and
production `argocd-sync`, require `--class-a-ref=<artifact>`.

## Evidence

The runner writes redacted evidence to:

- `audit/evidence/codebuild-deploy-runner-latest.json`
- `audit/evidence/codebuild-deploy-start-latest.json`

WORM evidence writes require the CodeBuild role permissions declared in
`deploy/terraform/modules/codebuild-deploy-executor/`.
