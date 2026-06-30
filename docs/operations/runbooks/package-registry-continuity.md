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
- Public npm token, if needed, is stored in Baseline vault and redacted
  readiness witness passes with `--execute`.

## References

- AWS CodeArtifact npm setup: <https://docs.aws.amazon.com/codeartifact/latest/ug/npm-auth.html>
- npm access tokens: <https://docs.npmjs.com/creating-and-viewing-access-tokens/>
- npm two-factor authentication: <https://docs.npmjs.com/configuring-two-factor-authentication/>
