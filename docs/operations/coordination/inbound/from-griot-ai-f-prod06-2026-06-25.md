---
title: 'Inbound handoff — griot-ai F-prod-06 api.griot.ai HTTPS'
from: griot-ai
to: fabric-os
date: 2026-06-27
storyId: STORY-GRIOT-HTTPS-001
blockerId: F-prod-06
milestoneId: M5-production-assurance
programmeId: PROG-GRIOT-AI
status: acknowledged
---

# Inbound handoff: griot-ai `F-prod-06` — `api.griot.ai` HTTPS

**From:** `griot-ai`  
**To:** `fabric-os` (infra owner)  
**Date:** 2026-06-27  
**Story:** `STORY-GRIOT-HTTPS-001`  
**Blocker:** `F-prod-06` — HTTPS ACM-validated live in prod  
**Authority class:** A (operator DNS action required)

## Acknowledgement

Fabric-os acknowledges the inbound handoff from `griot-ai/docs/operations/coordination/from-griot-ai-https-acm-2026-06-25.md`.

- `griot.gtcx.trade` is already green and remains the canonical production endpoint.
- `api.griot.ai` is **not** yet green. Root cause narrowed to a missing Dynadot ACM validation CNAME plus an A record that still points to AWS Global Accelerator IPs.

## Diagnosis

| Check                                                                                           | Result                                                                                                |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ACM cert `arn:aws:acm:af-south-1:348389439381:certificate/6c40f4cf-ebc4-40bf-a6c1-6c70322627a1` | `PENDING_VALIDATION` for `api.griot.ai`                                                               |
| Validation CNAME `_63e8eb3807cda8940404d774d406cbed.api.griot.ai`                               | **Missing** from Dynadot/Afternic DNS                                                                 |
| `api.griot.ai` A record                                                                         | Resolves to `13.248.169.48` / `76.223.54.146` (Global Accelerator; no valid cert)                     |
| Griot ALB (`af-south-1`)                                                                        | `k8s-griotai-griotapi-43e646ace1-668524754.af-south-1.elb.amazonaws.com` — exists, HTTP listener only |
| `griot.gtcx.trade`                                                                              | HTTP/2 200 via `eu-west-1` ALB (separate, already validated)                                          |

## Required operator action

1. **Dynadot / Afternic DNS** — add the ACM validation CNAME:

   | Type  | Name                                    | Value                                                               |
   | ----- | --------------------------------------- | ------------------------------------------------------------------- |
   | CNAME | `_63e8eb3807cda8940404d774d406cbed.api` | `_67777edb81ef1f05dd8cb9d3dd4fcc67.jkddzztszm.acm-validations.aws.` |

2. **Dynadot / Afternic DNS** — repoint `api.griot.ai` to the Griot ALB:

   | Type  | Name  | Value                                                                    |
   | ----- | ----- | ------------------------------------------------------------------------ |
   | CNAME | `api` | `k8s-griotai-griotapi-43e646ace1-668524754.af-south-1.elb.amazonaws.com` |

3. **Fabric-os (EKS with kubectl access)** — apply the HTTPS ingress manifest once ACM is `ISSUED`:

   ```bash
   kubectl apply -f ../griot-ai/deploy/infra/k8s/ingress-https.yaml
   ```

4. **Verify** with:

   ```bash
   pnpm griot:prod:verify:write
   curl -I https://api.griot.ai/health
   ```

## Owner artifacts

- Runbook: `docs/operations/runbooks/griot-ai-https-production.md`
- Verification script: `platform/scripts/production/verify-griot-ai-https-prod.mjs`
- Evidence: `audit/evidence/griot-ai-https-prod-verify-latest.json`
- Hub witness: `../bridge-os/pm/ci/fabric-os-blocker-fprod06-latest.json`

## Status

- `fabric-os`: diagnosis complete; runbook + verification updated.
- `griot-ai`: waiting for `https://api.griot.ai/health` HTTP/2 200 before closing `GRIOT-LIVE-STAGING-001`.
