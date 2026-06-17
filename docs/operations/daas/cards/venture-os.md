---
title: 'DaaS card — venture-os'
status: delivered
date: 2026-06-17
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
laneId: L5
deployProduct: product-hosted
friction: F1
productOwner: venture-os
protocol: P41-DEVOPS-AS-A-SERVICE
---

# DaaS card: venture-os (F1)

## Profile

| Field                | Value                                                     |
| -------------------- | --------------------------------------------------------- |
| **laneId**           | **L5** — GTM / venture intelligence                       |
| **deployProduct**    | **product-hosted**                                        |
| `deployment-profile` | `venture-os/docs/operations/deploy/deployment-profile.md` |
| Deploy mode          | `static` on EKS                                           |
| Namespace            | `venture-os-staging`                                      |
| Staging URL          | `https://venture-staging.gtcx.trade`                      |

## Infra obligation

1. EKS namespace + IRSA (`venture-os-aws-secrets` SecretStore)
2. ExternalSecret mirror for `VENTURE_WEBHOOK_SECRET`, `CLICKUP_*`, `LISTMONK_*` from AWS SM
3. ALB ingress `venture-staging.gtcx.trade` (shared `gtcx-staging-api` group + WAF)
4. ECR image `gtcx-venture-os:latest`

## Apply path

```bash
# From fabric-os (after terraform apply module.secrets + SM populate)
kubectl apply -k deploy/kubernetes/overlays/staging/venture-os/
kubectl get externalsecret -n venture-os-staging
kubectl get pods -n venture-os-staging
```

## Build / push (venture-os repo)

```bash
export AWS_REGION=af-south-1
export ECR_REPO=348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-venture-os
export PUSH=1
./deploy/scripts/build-push-ecr.sh
```

## SM populate

```bash
./platform/scripts/staging/populate-venture-os-staging-sm.sh
```

## Verification (2026-06-17)

| Probe                                               | Result                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `venture-os-secrets` ExternalSecret                 | **SecretSynced True**                                             |
| Pod `venture-os-*`                                  | **1/1 Running**                                                   |
| ALB origin `GET /api/health` (Host header)          | **200** `{"status":"ok"}`                                         |
| `GET https://venture-staging.gtcx.trade/api/health` | **200** — ACM `venture-staging.gtcx.trade` + Cloudflare DNS CNAME |

## DNS + TLS (fabric-os)

```bash
# Vault: CLOUDFLARE_DNS_API_TOKEN (Zone DNS Edit — not Workers-only CLOUDFLARE_API_TOKEN)
set -a && source ~/.baseline/env && set +a
export CLOUDFLARE_API_TOKEN="$(baseline vault get CLOUDFLARE_DNS_API_TOKEN --trust-score 100)"
export ALB_DNS="k8s-gtcxstagingapi-295a96727a-1533822930.af-south-1.elb.amazonaws.com"
export CLOUDFLARE_COMPLIANCE_HOST="venture-staging"
export CLOUDFLARE_PROXIED="false"
deploy/03-platform/scripts/attach-compliance-os-prod-domain.sh
```

ACM cert: `arn:aws:acm:af-south-1:348389439381:certificate/5fb27ff7-3e2c-499b-93d1-1bc7cb8aa62a` (ingress annotation on `venture-os` ALB).

## Product handback

When seal **delivered**: venture-os runs `pnpm ops:check` and records URL in `audit/evidence/deployment-proof-latest.json`.

## Seal

Status **delivered** — EKS origin + public hostname live 2026-06-17.
