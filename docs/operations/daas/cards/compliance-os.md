---
title: DaaS card — compliance-os
status: done
date: 2026-06-10
friction: F2
owner: gtcx-infrastructure
productOwner: compliance-os
protocol: P41-DEVOPS-AS-A-SERVICE
---

# DaaS card: compliance-os (F2)

## Profile

| Field                     | Value                                                   |
| ------------------------- | ------------------------------------------------------- |
| `deployment-profile.json` | `compliance-os/docs/operations/deployment-profile.json` |
| Deploy mode               | `eks-service` (multi-workload)                          |
| Matrix ref                | `INF-PER-REPO-001#compliance-os`                        |
| Namespace                 | `compliance-os-staging`                                 |

## Infra obligation

1. GHCR `imagePullSecret` via ESO (`compliance-os-ghcr-pull` ← `gtcx/compliance-os/staging/ghcr-pull-token`)
2. Non-W2 service secrets (api, caas, core12, via, vxa, minio) via ESO
3. Attach `imagePullSecrets: [compliance-os-ghcr-pull]` on **all** GHCR deployments

## Apply path

```bash
bash platform/scripts/staging/populate-compliance-os-staging-sm.sh   # SM populate
kubectl apply -k deploy/kubernetes/overlays/staging/compliance-os/
kubectl get externalsecret -n compliance-os-staging
```

## Verification (2026-06-10)

| Probe                                    | Result                                         |
| ---------------------------------------- | ---------------------------------------------- |
| `compliance-os-ghcr-pull` ExternalSecret | **SecretSynced True**                          |
| `staging-web-app`                        | **1/1 Running** (imagePullSecret attached)     |
| `staging-compliance-api-app`             | **imagePullSecrets attached** (2026-06-10)     |
| All 8 GHCR deployments                   | **compliance-os-ghcr-pull** on pod spec        |
| Product gate                             | `pnpm w2:staging-prereq-check` (compliance-os) |

## Next infra action

None for F2 — imagePullSecrets on all GHCR deployments. App pods may remain Pending until cluster capacity or image tag sync (compliance-os GitOps).

## Product handback

Hub #17 steps 2–5 when web + API pods Ready.
