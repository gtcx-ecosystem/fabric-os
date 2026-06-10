---
title: SECaaS card — compliance-os
status: done
date: 2026-06-10
friction: SEC-IRSA-01
owner: gtcx-infrastructure
---

# SECaaS card — compliance-os

**Friction:** `SEC-IRSA-01` (closed) · **DaaS overlap:** `F2` (GHCR imagePullSecrets)

## Verification (2026-06-10)

| Check                         | Result                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| IRSA trust `compliance-os-sa` | Scoped to `compliance-os-staging:compliance-os-sa`            |
| Reader policy                 | `GetSecretValue` + `DescribeSecret` on 7 staging SM ARNs only |
| ExternalSecrets               | **7/7** Ready                                                 |
| GHCR imagePullSecrets         | **8/8** deployments                                           |

**Evidence:** `audit/evidence/secas-irsa-compliance-os-2026-06-10.json`

## Product handoff

When app-level control changes: `compliance-os/docs/operations/to-gtcx-infrastructure-{topic}-YYYY-MM-DD.md`

## Re-probe

`pnpm --dir ../compliance-os w2:staging-prereq-check` after infra seal.
