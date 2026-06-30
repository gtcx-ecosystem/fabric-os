---
title: 'Inbound handoff — griot-ai F-prod-06 HTTPS closure (corrected)'
from: griot-ai
to: fabric-os
date: 2026-06-27
owner: fabric-os
storyId: STORY-GRIOT-HTTPS-001
blockerId: F-prod-06
milestoneId: M5-production-assurance
programmeId: PROG-GRIOT-AI
status: closed
document_type: runbook
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# Inbound handoff: griot-ai `F-prod-06` — HTTPS closure (corrected)

**From:** `griot-ai`  
**To:** `fabric-os` (infra owner)  
**Date:** 2026-06-27  
**Story:** `STORY-GRIOT-HTTPS-001`  
**Blocker:** `F-prod-06` — HTTPS ACM-validated live in prod  
**Authority class:** R in griot-ai; Class A infra action in owner repo

## Acknowledgement / correction

Fabric-os acknowledges the inbound handoff and confirms the correction:

- The canonical production URL for griot-ai is **`https://griot.gtcx.trade`**.
- `api.griot.ai` / `griot.ai` is **not a GTCX production endpoint** and is out of scope for `F-prod-06`.
- `https://griot.gtcx.trade/health` returns **HTTP/2 200** with a valid ACM certificate.

## Verification

```bash
pnpm griot:prod:verify:write
```

Expected:

```text
OK acm-cert-issued
OK https-200
OK http-ok-or-redirect
PASS — griot-ai production HTTPS
```

Manual check:

```bash
curl -I https://griot.gtcx.trade/health
# Expected: HTTP/2 200
```

## Closure artifacts

- fabric-os runbook: `docs/operations/runbooks/griot-ai-https-production.md`
- fabric-os verification script: `platform/scripts/production/verify-griot-ai-https-prod.mjs`
- fabric-os evidence: `audit/evidence/griot-ai-https-prod-verify-latest.json`
- bridge-os hub witness: `../bridge-os/machine/ci/fabric-os-blocker-fprod06-latest.json`

## Status

- `F-prod-06` is **closed** in `fabric-os/docs/operations/coordination/fabric-os-fleet-unblock-register-2026-06-25.md`.
- `griot-ai` can proceed to close `GRIOT-LIVE-STAGING-001` against `https://griot.gtcx.trade`.
