---
title: 'Witness — Hub #17 prod W2 partial (terraform + SM)'
status: partial
date: 2026-06-08
owner: gtcx-infrastructure
hub_blocker: 17
er1: ER-1-10
authority_class: A
---

# Witness — Hub #17 prod W2 (partial)

**Status:** Terraform + AWS SM **complete**. K8s apply **blocked** — production EKS API is private (`10.4.x.x:443` i/o timeout from operator laptop). `compliance.gtcx.trade` still **525** until overlay apply + DNS.

## Terraform apply (production)

```text
Target: module.secrets (compliance-os)
Result: 11 added, 0 changed, 0 destroyed
IRSA: arn:aws:iam::348389439381:role/gtcx-production-compliance-os-secrets-role
Cluster: gtcx-production (af-south-1)
```

## AWS SM paths (names only)

| Path                                            | Status             |
| ----------------------------------------------- | ------------------ |
| `gtcx/compliance-os/production/w2`              | populated — 7 keys |
| `gtcx/compliance-os/production/ghcr-pull-token` | populated          |

W2 keys present: `COMPLIANCE_OS_INTAKE_API_KEY`, `COMPLIANCE_OS_INTAKE_ORGANIZATION_ID`, `COMPLIANCE_OS_TERMINAL_OS_URL`, `COMPLIANCE_OS_TERMINAL_API_KEY`, `COMPLIANCE_API_URL`, `COMPLIANCE_API_INTERNAL_TOKEN`, `COMPLIANCE_OS_SESSION_SECRET`.

**Terminal key:** generated fresh — align with terminal-os prod receiver before compliance-os PATCH proof.

## K8s (pending — bastion/VPN required)

```bash
kubectl config use-context arn:aws:eks:af-south-1:348389439381:cluster/gtcx-production
./scripts/production/install-compliance-os-eso.sh
```

Overlay: `infra/kubernetes/overlays/production/compliance-os/`

## Probe

```text
curl https://compliance.gtcx.trade/ → 525 (pre-ingress)
```

## Next

1. Apply K8s overlay from bastion with production cluster access.
2. Pin amd64 `compliance-web` prod image tag in `web-app.yaml`.
3. Cloudflare CNAME `compliance.gtcx.trade` → prod ALB.
4. Intake smoke → 201; post full witness `from-gtcx-infrastructure-hub-17-prod-w2-sealed-*.md`.
5. exploration-os `w2:prod:retest` → baseline-os locker #17 close.
