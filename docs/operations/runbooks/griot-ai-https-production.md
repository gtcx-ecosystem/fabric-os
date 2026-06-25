---
title: 'griot-ai production HTTPS — api.griot.ai'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'griot-ai', 'production', 'https', 'acm', 'F-prod-06']
review_cycle: on-change
---

# griot-ai production HTTPS — `api.griot.ai` (F-prod-06)

Fabric-os owns the production ACM + ALB HTTPS ingress that unblocks griot-ai `STORY-GRIOT-HTTPS-001` / `F-prod-06`.

## Current state

| Endpoint                      | Status     | Note                                                                          |
| ----------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `http://api.griot.ai/health`  | 🟢 Live    | HTTP 200                                                                      |
| `https://api.griot.ai/health` | 🔴 Pending | TLS unrecognized name (SSL alert 112) — ACM cert not validated / not attached |
| `http://griot.gtcx.trade`     | 🟢 Live    | HTTP 200                                                                      |
| `https://griot.gtcx.trade`    | 🔴 Pending | Same ACM cert dependency                                                      |

## Root cause

ACM certificate `arn:aws:acm:af-south-1:348389439381:certificate/75e7eb0b-d0a1-4bec-8ae3-2a042d2d0bea` entered `VALIDATION_TIMED_OUT` for `api.griot.ai`. The CNAME validation record was never added at the `griot.ai` registrar (Dynadot). `griot.gtcx.trade` SAN already validated successfully (Cloudflare CNAME present).

## Action taken by fabric-os (2026-06-25)

1. Re-issued ACM certificate:
   ```text
   arn:aws:acm:af-south-1:348389439381:certificate/6c40f4cf-ebc4-40bf-a6c1-6c70322627a1
   ```
2. Updated griot-ai ingress manifest with new cert ARN:
   `griot-ai/deploy/infra/k8s/ingress-https.yaml`
3. Updated griot-ai HTTPS runbook:
   `griot-ai/docs/operations/dr/https-runbook.md`

## Required operator actions

### 1. Add ACM validation CNAME at Dynadot (`griot.ai`)

| Type  | Host                                    | Value                                                               |
| ----- | --------------------------------------- | ------------------------------------------------------------------- |
| CNAME | `_63e8eb3807cda8940404d774d406cbed.api` | `_67777edb81ef1f05dd8cb9d3dd4fcc67.jkddzztszm.acm-validations.aws.` |

No proxy / no HTTP redirect — the CNAME must return the ACM validation value directly.

### 2. Confirm Cloudflare CNAME for `griot.gtcx.trade` (should already exist)

| Type  | Host                                      | Value                                                               |
| ----- | ----------------------------------------- | ------------------------------------------------------------------- |
| CNAME | `_b43eb7837ddba8a6e3756bae0a6ac5b5.griot` | `_fcb5a4ffe88aa6de2967b3f4d4041528.jkddzztszm.acm-validations.aws.` |

### 3. Wait for ACM validation

```bash
aws acm wait certificate-validated \
  --certificate-arn arn:aws:acm:af-south-1:348389439381:certificate/6c40f4cf-ebc4-40bf-a6c1-6c70322627a1 \
  --region af-south-1
```

Typical time: 5–30 minutes after DNS propagation.

### 4. Apply HTTPS ingress from production-authorized network

Production EKS API is restricted; apply from a bastion / authorized workstation:

```bash
cd /path/to/griot-ai
kubectl apply --dry-run=client -f deploy/infra/k8s/ingress-https.yaml
kubectl apply -f deploy/infra/k8s/ingress-https.yaml
```

### 5. Verify

```bash
curl -I https://api.griot.ai/health
# Expected: HTTP/2 200

curl -I http://api.griot.ai/health
# Expected: HTTP/1.1 308 Permanent Redirect
```

## Verification artifact

- griot-ai: `audit/evidence/staging-narrative-probe-latest.json`
- fabric-os: `audit/evidence/griot-ai-https-prod-verify-latest.json` (after `pnpm griot:prod:verify:write`)

## Class A/S boundary

- **Fabric-os (done):** Re-issue ACM cert, update manifest + runbook, provide exact CNAME records.
- **Operator (pending):** Dynadot CNAME, production kubectl apply.
- **griot-ai (after):** Re-run narrative probe and close `STORY-GRIOT-LIVE-STAGING-001`.

## Related

- Fleet unblock register: `docs/operations/coordination/fabric-os-fleet-unblock-register-2026-06-25.md`
- Inbound handoff: `griot-ai/docs/operations/coordination/from-griot-ai-https-acm-2026-06-25.md`
- Cross-repo blocker discovery protocol: `docs/operations/protocols/cross-repo-blocker-discovery.md`
