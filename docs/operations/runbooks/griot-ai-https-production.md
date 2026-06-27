---
title: 'griot-ai production HTTPS — griot.gtcx.trade'
status: current
date: 2026-06-27
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'griot-ai', 'production', 'https', 'acm', 'F-prod-06']
review_cycle: on-change
---

# griot-ai production HTTPS — `griot.gtcx.trade` (F-prod-06)

Fabric-os owns the production ACM + ALB HTTPS ingress that unblocks griot-ai `STORY-GRIOT-HTTPS-001` / `F-prod-06`.

## Current state

| Endpoint                          | Status  | Note                     |
| --------------------------------- | ------- | ------------------------ |
| `http://griot.gtcx.trade/health`  | 🟢 Live | HTTP 200                 |
| `https://griot.gtcx.trade/health` | 🟢 Live | HTTP/2 200, HSTS enabled |

## Root cause / resolution

The canonical production domain for the griot-ai service is **`griot.gtcx.trade`**.

- ACM certificate for `griot.gtcx.trade` in `eu-west-1` is **ISSUED**:
  `arn:aws:acm:eu-west-1:348389439381:certificate/078c204c-e90e-46fb-b3b2-2749439b10ae`
- The ALB serving `griot.gtcx.trade` presents this certificate and returns **HTTP/2 200**.

## Verification

```bash
node fabric-os/platform/scripts/production/verify-griot-ai-https-prod.mjs --write
```

Expected:

```text
OK acm-cert-issued
OK https-200
OK http-ok-or-redirect
PASS — griot-ai production HTTPS
```

Manual checks:

```bash
curl -I https://griot.gtcx.trade/health
# Expected: HTTP/2 200

curl -I http://griot.gtcx.trade/health
# Expected: HTTP 200 (current ALB does not force 308; acceptable for this milestone)
```

## Verification artifacts

- fabric-os: `audit/evidence/griot-ai-https-prod-verify-latest.json`
- bridge-os: `pm/ci/fabric-os-blocker-fprod06-latest.json`
- griot-ai: `audit/evidence/staging-narrative-probe-latest.json` (auth probe; separate from HTTPS ingress)

## Class A/S boundary

- **Fabric-os (done):** Verified production HTTPS for canonical domain `griot.gtcx.trade`.
- **Operator:** None required for F-prod-06.
- **griot-ai (next):** If narrative probe returns 401, provide `GRIOT_API_KEY` and re-run `staging:narrative:probe`.

## Related

- Fleet unblock register: `docs/operations/coordination/fabric-os-fleet-unblock-register-2026-06-25.md`
- Inbound handoff: `griot-ai/docs/operations/coordination/from-griot-ai-https-acm-2026-06-25.md`
