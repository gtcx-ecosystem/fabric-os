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

The buildspec pins Node.js 22 because the workspace includes packages with a
Node.js `>=22.12.0` engine requirement. It also activates the exact pnpm version
declared by the root `packageManager` field.

Use `--execute` only in a credentialed session. `terraform-apply`, and
production `argocd-sync`, require `--class-a-ref=<artifact>`.

### Secret environment variables

Use `--secret-env=NAME=SECRETS_MANAGER_REFERENCE` for deployment credentials.
Do not pass tokens through `--env`, because `--env` is a plaintext CodeBuild
override and is recorded in start evidence.

For Cloudflare DNS-backed ACM validation, mirror the Baseline Vault
`CLOUDFLARE_DNS_API_TOKEN` value into an AWS Secrets Manager secret that matches
the deploy executor IAM boundary (`gtcx/*`), then start a staging plan with:

```bash
pnpm deployment:codebuild:start -- --environment=staging --mode=plan --secret-env=CLOUDFLARE_API_TOKEN=gtcx/staging/cloudflare-dns-api-token --write
```

## Evidence

The runner writes redacted evidence to:

- `audit/evidence/codebuild-deploy-runner-latest.json`
- `audit/evidence/codebuild-deploy-start-latest.json`

WORM evidence writes require the CodeBuild role permissions declared in
`deploy/terraform/modules/codebuild-deploy-executor/`.
