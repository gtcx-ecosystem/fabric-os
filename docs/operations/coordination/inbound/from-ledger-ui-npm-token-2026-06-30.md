---
title: 'Inbound handoff — ledger-ui NPM_TOKEN provisioning'
status: current
date: 2026-06-30
owner: fabric-os
document_type: coordination-handoff
source: ledger-ui
---

# Coordination handoff

- **From repo:** ledger-ui
- **To repo:** fabric-os
- **Story / ticket:** S26-04 (NPM_TOKEN handoff)
- **Blocker:** npm user `gtcx-protocol` read token not yet provisioned in the infrastructure secret store for use by GTCX build/CI runners.
- **Evidence path:**
  - ledger-ui commits `75d4c735`, `ff766de5`, `7bee324d` — NPM token access instructions and credential-pointer updates.
  - ledger-ui commit `83c61912` — refreshed auto-dev-state and cross-repo deps.
- **Resume when:** `NPM_TOKEN` for npm user `gtcx-protocol` is available to ledger-ui CI/build runners (expected via AWS Secrets Manager or Baseline vault), and a redacted witness confirms consumption without exposing the secret.

## Context

ledger-ui has published canonical access instructions for the enterprise runner and updated agent credential pointers to route through `fabric-os`. The documentation and handoff are complete on the ledger-ui side. The remaining step is provisioning the actual `NPM_TOKEN` secret, which is an infrastructure/operator-owned action in `fabric-os`.

## Required secret

| Secret      | User / purpose                                                   | Target store                                                     | Authority                                   |
| ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| `NPM_TOKEN` | npm user `gtcx-protocol` — read-only package access for CI/build | `fabric-os` secret store (AWS Secrets Manager or Baseline vault) | Class A/S — operator / infrastructure owner |

## Completion signal

- Secret exists and is retrievable by approved runner/CI path.
- ledger-ui build succeeds using the provisioned token.
- Redacted evidence witness is written (no raw secret in repo).

## Notes

- Do not commit the token value.
- If Baseline vault is used, ensure `fabric-os` runtime and ledger-ui consumers have trust-gated access per Protocol 19.
