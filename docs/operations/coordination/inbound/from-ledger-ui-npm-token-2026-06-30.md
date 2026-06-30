---
title: 'Inbound handoff — ledger-ui NPM_TOKEN provisioning'
status: current
date: 2026-06-30
owner: fabric-os
document_type: coordination-handoff
source: ledger-ui
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# Coordination handoff

- **From repo:** ledger-ui
- **To repo:** fabric-os
- **Story / ticket:** S26-04 (NPM_TOKEN handoff)
- **Blocker:** Previous npm account access is blocked; npm user `gtcx-protocol` token is not available in Baseline vault for GTCX build/CI runners.
- **Evidence path:**
  - ledger-ui commits `75d4c735`, `ff766de5`, `7bee324d` — NPM token access instructions and credential-pointer updates.
  - ledger-ui commit `83c61912` — refreshed auto-dev-state and cross-repo deps.
- **Resume when:** either CodeArtifact internal registry is available to the approved enterprise runner, or a new/recovered npmjs account token is stored in the bridge-os/Baseline vault SoR and projected only as needed into approved CI runners.

## Context

ledger-ui has published canonical access instructions for the enterprise runner and updated agent credential pointers to route through `fabric-os`. The documentation and handoff are complete on the ledger-ui side. Because the previous npm account is locked, Fabric is running two lanes in parallel: AWS CodeArtifact for internal package continuity, and new/recovered npmjs account access for public publishing.

## Required secret

| Secret      | User / purpose                                                   | System of record             | Runner projection                                     | Authority                                   |
| ----------- | ---------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| `NPM_TOKEN` | npm user `gtcx-protocol` — read-only package access for CI/build | bridge-os/Baseline vault SoR | approved CI runner environment; AWS SM only if needed | Class A/S — operator / infrastructure owner |

## Dual-track continuity

Canonical runbook:

```bash
docs/operations/runbooks/package-registry-continuity.md
```

Track 1, internal continuity:

- AWS CodeArtifact domain `gtcx-packages`.
- AWS CodeArtifact repository `npm-internal`.
- Terraform module `deploy/terraform/modules/codeartifact-npm-registry/`.
- No long-lived `NPM_TOKEN`; runner auth uses AWS IAM/session auth.

Track 2, public continuity:

- Create and secure a new npm account/org.
- Recover old npm account/scope in parallel.
- Store any new npmjs token in bridge-os/Baseline vault as `NPM_TOKEN`.
- Use new public scope only where package-name migration is acceptable.

## Fabric verification

Fabric owns the CI/automation policy and redacted readiness witness, not the
raw token value.

```bash
pnpm ci:npm-token:readiness
pnpm ci:npm-token:readiness -- --execute --write
pnpm package-registry:continuity:check
```

The readiness script uses `../baseline-os/platform/packages/baselineos/dist/cli/bin.js vault get NPM_TOKEN`
internally and records only metadata in
`audit/evidence/ci-npm-token-readiness-latest.json`.

Operator vault entry, when authorized:

```bash
pnpm --dir ../bridge-os agent:vault:verify
node ../baseline-os/platform/packages/baselineos/dist/cli/bin.js vault store NPM_TOKEN --from-env NPM_TOKEN --provider npm --type api-key --min-trust-score 90
```

## Completion signal

- CodeArtifact internal registry exists and is reachable by the approved runner, or npmjs token exists in bridge-os/Baseline vault and is retrievable by approved runner/CI path.
- ledger-ui build succeeds using the provisioned token.
- Redacted evidence witness is written (no raw secret in repo).

## Notes

- Do not commit the token value.
- Baseline vault is the SoR. If AWS Secrets Manager is used, treat it as a CI runner projection/cache only, not the canonical credential store.
- Ensure `fabric-os` runtime and ledger-ui consumers have trust-gated access per Protocol 19.
