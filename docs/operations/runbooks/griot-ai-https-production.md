---
title: 'griot-ai production HTTPS — F-prod-06'
status: current
date: 2026-06-27
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'griot-ai', 'production', 'https', 'acm', 'F-prod-06']
review_cycle: on-change
---

# griot-ai production HTTPS — `F-prod-06`

Fabric-os owns the production ACM + ALB HTTPS ingress that unblocks griot-ai `STORY-GRIOT-HTTPS-001` / `F-prod-06`.

## Current state

| Endpoint                          | Status     | Note                                                 |
| --------------------------------- | ---------- | ---------------------------------------------------- |
| `http://griot.gtcx.trade/health`  | 🟢 Live    | HTTP 200                                             |
| `https://griot.gtcx.trade/health` | 🟢 Live    | HTTP/2 200, HSTS enabled                             |
| `http://api.griot.ai/health`      | 🟢 Live    | HTTP 200                                             |
| `https://api.griot.ai/health`     | 🔴 Pending | TLS `unrecognized name`; ACM cert pending validation |

### Why `api.griot.ai` is still pending

- The `api.griot.ai` DNS zone is hosted at **Dynadot/Afternic** (`ns1.afternic.com.` / `ns2.afternic.com.`).
- The ACM certificate in `af-south-1` (`arn:aws:acm:af-south-1:348389439381:certificate/6c40f4cf-ebc4-40bf-a6c1-6c70322627a1`) is waiting for DNS validation for the `api.griot.ai` SAN.
- The required validation CNAME is **missing** from Dynadot.
- The current `api.griot.ai` A record resolves to AWS Global Accelerator IPs (`13.248.169.48`, `76.223.54.146`) instead of the Griot ALB in `af-south-1`.

## Required DNS changes (Dynadot / Afternic)

Add the following records in the `griot.ai` zone. The CNAME is required for ACM validation; the A/ALIAS/CNAME change repoints traffic to the Griot ALB.

### 1. ACM validation CNAME

| Type  | Name                                    | Value                                                               |
| ----- | --------------------------------------- | ------------------------------------------------------------------- |
| CNAME | `_63e8eb3807cda8940404d774d406cbed.api` | `_67777edb81ef1f05dd8cb9d3dd4fcc67.jkddzztszm.acm-validations.aws.` |

Verify with:

```bash
dig +short _63e8eb3807cda8940404d774d406cbed.api.griot.ai CNAME
# expected: _67777edb81ef1f05dd8cb9d3dd4fcc67.jkddzztszm.acm-validations.aws.
```

### 2. Endpoint record (choose one)

**Option A — CNAME to ALB** (preferred if Dynadot supports CNAME on subdomains):

| Type  | Name  | Value                                                                    |
| ----- | ----- | ------------------------------------------------------------------------ |
| CNAME | `api` | `k8s-griotai-griotapi-43e646ace1-668524754.af-south-1.elb.amazonaws.com` |

**Option B — A record to ALB IPs** (only if CNAME is not supported):

Resolve the ALB DNS name to its current IPs and create A records:

```bash
dig +short k8s-griotai-griotapi-43e646ace1-668524754.af-south-1.elb.amazonaws.com A
```

> Do **not** leave the existing A record pointing to the Global Accelerator IPs (`13.248.169.48`, `76.223.54.146`). Those IPs do not present a certificate for `api.griot.ai`.

## AWS-side steps (after DNS validation succeeds)

### 1. Wait for ACM validation

```bash
aws acm wait certificate-validated \
  --certificate-arn arn:aws:acm:af-south-1:348389439381:certificate/6c40f4cf-ebc4-40bf-a6c1-6c70322627a1 \
  --region af-south-1
```

### 2. Apply the HTTPS ingress manifest

The manifest is owned by `griot-ai` but applied by `fabric-os` in the production EKS cluster:

```bash
# cwd: fabric-os
kubectl apply --dry-run=client -f ../griot-ai/deploy/infra/k8s/ingress-https.yaml
kubectl apply -f ../griot-ai/deploy/infra/k8s/ingress-https.yaml
```

This creates an ALB HTTPS listener on port 443 with the ACM certificate attached and an HTTP → HTTPS redirect.

### 3. Verify the ALB listener

```bash
aws elbv2 describe-listeners \
  --load-balancer-arn arn:aws:elasticloadbalancing:af-south-1:348389439381:loadbalancer/app/k8s-griotai-griotapi-43e646ace1/c9735bb1646ea77a \
  --region af-south-1 \
  --query 'Listeners[*].{Port:Port,Protocol:Protocol,Cert:Certificates[0].CertificateArn}'
```

Expected: a listener on port `443` / `HTTPS` with cert `arn:aws:acm:af-south-1:348389439381:certificate/6c40f4cf-ebc4-40bf-a6c1-6c70322627a1`.

## Verification

```bash
pnpm griot:prod:verify:write
```

Expected when fully resolved:

```text
OK canonical-acm-cert-issued
OK canonical-https-200
OK canonical-http-ok-or-redirect
OK api-acm-cert-validated
OK api-acm-cname-present
OK api-https-200
OK api-http-ok-or-redirect
PASS — griot-ai production HTTPS
```

Manual checks:

```bash
curl -I https://api.griot.ai/health
# Expected: HTTP/2 200

curl -I http://api.griot.ai/health
# Expected: HTTP/1.1 308 Permanent Redirect → https://api.griot.ai/health
```

## Verification artifacts

- fabric-os: `audit/evidence/griot-ai-https-prod-verify-latest.json`
- bridge-os: `pm/ci/fabric-os-blocker-fprod06-latest.json`
- griot-ai: `audit/evidence/staging-narrative-probe-latest.json`

## Class A/S boundary

- **Fabric-os (done):** Identified the missing Dynadot CNAME, the DNS mispointing, and the required AWS ALB/ingress steps. Verification script + evidence updated.
- **Operator (Class A):** Add the Dynadot CNAME + repoint `api.griot.ai` to the Griot ALB, then apply the HTTPS ingress from a host with EKS access.
- **griot-ai (next):** After `api.griot.ai` HTTPS returns 200, re-run `GRIOT_API_URL=https://api.griot.ai pnpm staging:narrative:probe` and close `GRIOT-LIVE-STAGING-001`.

## Related

- Fleet unblock register: `docs/operations/coordination/fabric-os-fleet-unblock-register-2026-06-25.md`
- Inbound handoff: `griot-ai/docs/operations/coordination/from-griot-ai-https-acm-2026-06-25.md`
- griot-ai HTTPS manifest: `../griot-ai/deploy/infra/k8s/ingress-https.yaml`
