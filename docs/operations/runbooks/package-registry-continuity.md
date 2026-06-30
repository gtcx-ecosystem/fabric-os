---
title: 'Package registry continuity'
status: current
date: 2026-06-30
owner: fabric-os
document_type: runbook
tier: critical
tags: ['package-registry', 'npm', 'codeartifact', 'ci', 'vault']
review_cycle: on-change
---

# Package Registry Continuity

This runbook handles the npm account lockout without making old-account recovery
the deployment critical path.

## Decision

Run two lanes in parallel:

1. **AWS CodeArtifact internal registry** for immediate `@gtcx/*` CI/build
   continuity.
2. **New npm account/org** for public npmjs distribution while old account
   recovery continues in parallel.

## Lane 1 — CodeArtifact internal registry

Purpose: unblock internal enterprise runner builds without long-lived
`NPM_TOKEN`.

Fabric module:

```bash
deploy/terraform/modules/codeartifact-npm-registry/
```

Default names:

| Item       | Value                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------- |
| Region     | `eu-west-1`                                                                              |
| Domain     | `gtcx-packages`                                                                          |
| Repository | `npm-internal`                                                                           |
| Upstream   | `public:npmjs`                                                                           |
| Rationale  | CodeArtifact has no `af-south-1` endpoint; runtime workloads still default to Cape Town. |

Class A apply creates the domain and repository. Runner auth uses AWS IAM and
short-lived CodeArtifact tokens.

Configure npm after apply:

```bash
aws codeartifact login --tool npm --domain gtcx-packages --repository npm-internal --region eu-west-1
npm ping
```

AWS documents `aws codeartifact login` as the recommended npm setup path; it
sets registry auth and the token is time-bound. The registry endpoint must end
with `/` when configuring manually.

Runner IAM must allow `codeartifact:GetAuthorizationToken`,
`codeartifact:GetRepositoryEndpoint`, `codeartifact:ReadFromRepository`, and
`sts:GetServiceBearerToken` for `codeartifact.amazonaws.com`. The staging
executor role is `gtcx-staging-deploy-executor`.

Live validation on 2026-06-30:

| Item         | Value                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------ |
| Account      | `348389439381`                                                                             |
| Domain ARN   | `arn:aws:codeartifact:eu-west-1:348389439381:domain/gtcx-packages`                         |
| Repo ARN     | `arn:aws:codeartifact:eu-west-1:348389439381:repository/gtcx-packages/npm-internal`        |
| Runner proof | `gtcx-staging-deploy-executor:c4f70e23-0f2c-4165-b681-72ea6ca42bfa` completed `SUCCEEDED`. |

The proof build assumed `arn:aws:sts::348389439381:assumed-role/gtcx-staging-deploy-executor/...`,
ran `aws codeartifact login`, and `npm ping` returned `PONG 922ms`.

### ledger-ui consumption

All GTCX repos should consume ledger-ui packages through the CodeArtifact npm
endpoint for internal builds:

```bash
aws codeartifact login --tool npm --domain gtcx-packages --repository npm-internal --region eu-west-1
pnpm add @gtcx/ui@0.4.2 @gtcx/tokens@0.3.0 @gtcx/utils@0.2.0
```

Core package surface verified on 2026-06-30:

| Package            | Version  |
| ------------------ | -------- |
| `@gtcx/tokens`     | `0.3.0`  |
| `@gtcx/utils`      | `0.2.0`  |
| `@gtcx/ui`         | `0.4.2`  |
| `@gtcx/layouts`    | `0.2.10` |
| `@gtcx/desk-shell` | `0.1.0`  |
| `@gtcx/pages`      | `0.1.8`  |
| `@gtcx/blocks`     | `0.1.0`  |

Evidence:

| Proof                | Build ID                                                            | Result      |
| -------------------- | ------------------------------------------------------------------- | ----------- |
| Publish/availability | `gtcx-staging-deploy-executor:2f805ac3-3c0e-4aca-8a18-267a1f5ea5cf` | `SUCCEEDED` |
| Clean install        | `gtcx-staging-deploy-executor:9bf69523-617a-438d-a066-95f24af0c603` | `SUCCEEDED` |

The clean install proof created an empty npm project, authenticated to
CodeArtifact, installed the packages above with exact versions, and `npm ls`
confirmed the installed tree. The detailed witness is
`audit/evidence/ledger-ui-codeartifact-consumption-latest.json`.

Some package versions already exist in the externally connected npmjs upstream.
CodeArtifact serves those through `public:npmjs`; `@gtcx/ui@0.4.2` is also
published with internal CodeArtifact origin. This is acceptable for internal
consumption. Future ledger-ui releases should publish bumped versions through
this runner so fabric-os can own internal availability even while npm account
recovery continues.

## Lane 2 — New npm account/org

Purpose: public npmjs publishing continuity.

### Operator Checklist

Account setup:

1. Create the new npm account.
2. Verify the account email before attempting publish.
3. Test CLI login:

```bash
npm login
npm whoami
```

Security setup:

1. Enable 2FA immediately.
2. Store recovery codes in the human password manager, not in any repo.
3. Require 2FA for package publishing and settings changes where npm allows it.
4. Add at least two human admins to the npm org once the org exists.

Organization/scope setup:

1. Create the npm organization/scope if the preferred scope is available.
2. If `@gtcx` is unavailable because it is tied to the locked account, create a
   temporary controlled scope and keep internal continuity on CodeArtifact.
3. Do not rename package scopes in product repos until the package migration is
   explicitly approved.

Token setup:

1. Generate the minimal npm token required for the release lane.
2. Treat publish-capable tokens as Class A credentials.
3. Store the token in bridge-os/Baseline vault as `NPM_TOKEN`:

```bash
pnpm --dir ../bridge-os agent:vault:verify
node ../baseline-os/platform/packages/baselineos/dist/cli/bin.js vault store NPM_TOKEN --from-env NPM_TOKEN --provider npm --type api-key --min-trust-score 90
```

4. Run the Fabric redacted witness:

```bash
pnpm ci:npm-token:readiness -- --execute --write
```

5. Run the ledger-ui enterprise release preflight from the approved runner:

```bash
pnpm publish:enterprise:check:quick
```

If the old `@gtcx` scope is unavailable, use the new npm scope only for public
packages that can tolerate a package-name migration. Keep internal package
continuity on CodeArtifact.

### Acceptance Criteria

- `npm whoami` returns the new release account.
- Account email is verified.
- 2FA is enabled and recovery codes are stored outside repos.
- npm org/scope decision is recorded: recovered old scope, new scope, or
  CodeArtifact-only for internal packages.
- `NPM_TOKEN` exists in bridge-os/Baseline vault if npmjs publishing is needed.
- `pnpm ci:npm-token:readiness -- --execute --write` passes after vault unlock.
- ledger-ui `pnpm publish:enterprise:check:quick` passes on the approved runner.

## Source of Truth

| Concern              | Owner                 | SoR                                     |
| -------------------- | --------------------- | --------------------------------------- |
| Internal CI registry | fabric-os             | AWS CodeArtifact Terraform + IAM        |
| npm token custody    | bridge-os             | Baseline vault                          |
| Public npm account   | human / release owner | npmjs account/org                       |
| Package consumers    | owning repo           | repo `.npmrc` / runner config / witness |

## Completion Signals

- `pnpm package-registry:continuity:check` passes.
- CodeArtifact repository exists after Class A apply.
- Enterprise runner can `npm ping` against CodeArtifact.
- GTCX consumer proof can install ledger-ui packages through CodeArtifact.
- Public npm token, if needed, is stored in Baseline vault and redacted
  readiness witness passes with `--execute`.

## References

- AWS CodeArtifact npm setup: <https://docs.aws.amazon.com/codeartifact/latest/ug/npm-auth.html>
- npm access tokens: <https://docs.npmjs.com/creating-and-viewing-access-tokens/>
- npm two-factor authentication: <https://docs.npmjs.com/configuring-two-factor-authentication/>
