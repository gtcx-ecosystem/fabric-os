---
title: 'Staging credential chain protocol'
status: current
date: 2026-06-25
owner: fabric-os
document_type: protocol
tier: operating
tags: ['operations', 'staging', 'secrets', 'protocol', 'PROD-READY-005']
review_cycle: quarterly
---

# Staging credential chain protocol

## Purpose

Ensure every product-repo staging environment that depends on fabric-os substrate has:

1. A deterministic, verifiable credential chain.
2. A safe handoff boundary between fabric-os (substrate owner) and the product repo.
3. Proactive CI gates that surface missing credentials before a story blocks.

## Pattern

For every product repo `X` that needs staging secrets:

| Layer                            | Owner        | Artifact                                                   | Authority |
| -------------------------------- | ------------ | ---------------------------------------------------------- | --------- |
| AWS Secrets Manager shell        | fabric-os    | `deploy/terraform/modules/secrets/<x>.tf`                  | R         |
| ESO SecretStore + ExternalSecret | fabric-os    | `deploy/kubernetes/overlays/staging/<x>/`                  | R         |
| Secret population script         | fabric-os    | `deploy/03-platform/scripts/staging/populate-<x>-sm.sh`    | A         |
| Verification script              | fabric-os    | `platform/scripts/staging/verify-<x>-staging-chain.mjs`    | R         |
| Product env population           | product repo | `<repo>/platform/scripts/staging/populate-env-from-sm.mjs` | R         |
| Local staging runtime            | product repo | `<repo>/deploy/docker/docker-compose.yml`                  | R         |

## Rules

1. **No raw secrets in git.** Ever. Values live only in AWS SM or local `.env.staging` on operator machines.
2. **Verification before handoff.** Fabric-os runs the verification script and archives redacted evidence before declaring the blocker unblocked.
3. **Class A boundary.** Only an authorized operator may populate live secret values in AWS SM. Agents prepare IaC and runbooks only.
4. **Product repo self-service.** Once AWS SM is populated, the product repo script fetches values without further fabric-os involvement.
5. **Proactive CI.** The verification script runs in CI (with appropriate skips when AWS/kubectl are unavailable) so missing credentials are caught early.

## Verification contract

A verification script must check:

- AWS SM secret shell exists
- Required keys are present and not placeholder values
- ESO resources exist in the correct namespace
- Synthesized K8s secret exists
- Product-repo integration script is present

Exit code 0 means the chain is ready for operator population or already populated.

## Enforcement

- Add `pnpm <repo>:staging:verify` to the repo's quality gates.
- Fleet-unblock register references the verification script path.
- Attestation gates remain open until verification passes and evidence is archived.
