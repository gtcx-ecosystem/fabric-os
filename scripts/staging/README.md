# `scripts/staging/` — Staging bootstrap helpers

One-shot scripts to populate staging secrets, install ESO manifests, and align service credentials. Run from repo root with appropriate AWS/kubectl context.

| Script                                              | Purpose                                           |
| --------------------------------------------------- | ------------------------------------------------- |
| `populate-*-staging-sm.sh`                          | Seed AWS Secrets Manager values for staging       |
| `install-*-eso.sh`                                  | Apply External Secrets Operator bundles           |
| `patch-compliance-gateway-auth-tokens.mjs`          | Align gateway bearer tokens with sibling services |
| `generate-compliance-gateway-audit-signing-key.mjs` | Mint audit-signing key material for staging       |

**Parent:** [`scripts/README.md`](../README.md) · **Runtime ops:** [`infra/scripts/`](../../infra/scripts/README.md)
