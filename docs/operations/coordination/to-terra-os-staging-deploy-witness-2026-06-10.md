---
title: 'Partial witness — terraos staging ESO + web pod (INF-TERRA)'
status: current
date: 2026-06-10
from: gtcx-infrastructure
to: terra-os
owner: terra-os
---

# Partial closure witness — terraos staging

**Re:** `from-terra-os-staging-deploy-blockers-2026-06-10.md`

## Done (2026-06-10)

| Item            | Evidence                                                                |
| --------------- | ----------------------------------------------------------------------- |
| SM secrets      | `terraos/staging/{ghcr-pull-token,rds,redis,app-secrets}` in af-south-1 |
| IRSA role       | `gtcx-staging-terraos-secrets-role`                                     |
| ESO SecretStore | `terraos-aws-secrets` Valid                                             |
| ExternalSecrets | `terraos-ghcr-pull`, `terraos-staging-secrets` → `SecretSynced=True`    |
| Web pod         | `terraos-staging-web-*` **Running** (50m CPU request)                   |

## Remaining (INF-TERRA-01)

| Item      | Evidence                                                                   |
| --------- | -------------------------------------------------------------------------- |
| API pod   | `terraos-staging-api-*` **Pending** — `Insufficient cpu` / `Too many pods` |
| Cluster   | 2 nodes @ 81–95% CPU allocated; compliance-os-staging ~22 pods             |
| `/health` | Blocked until API schedules                                                |

## Operator actions

1. Warm/scale `gtcx-staging` node group (`cost_profile=scheduled` may need `desired≥3` temporarily)
2. Or reduce compliance-os-staging footprint during terraos bring-up
3. After API Running: `bash platform/scripts/staging/smoke-staging.sh` (terra-os repo)
