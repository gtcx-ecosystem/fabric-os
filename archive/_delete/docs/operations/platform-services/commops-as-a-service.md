---
title: 'CommOps — communications substrate'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
initiative: INIT-OPS-LANES-OPERATIONALIZE
protocol: P53
---

# CommOps-as-a-Service

> **Ops lane:** **CommOps** · **Not PayOps** — payment rails are PayOps; this lane is email/SMS/push substrate.

**Spec:** `pm/spec/commops-as-a-service.json`  
**Substrate contract:** `pm/commops-substrate-contract.json`  
**Friction SoR:** `pm/commops-friction-register.json`  
**Forensic:** `audit/archive/2026-06-15/audit/ecosystem-revops-commops-forensic-2026-06-14.md`

## Channel registry

| Channel      | Provider         | Staging SM                                    |
| ------------ | ---------------- | --------------------------------------------- |
| Email        | SendGrid         | `gtcx/shared/staging/commops/sendgrid`        |
| SMS          | Africa's Talking | `gtcx/shared/staging/commops/africas-talking` |
| SMS/WhatsApp | Twilio           | `gtcx/shared/staging/commops/twilio`          |

## Verification

```bash
pnpm commops:check:write
pnpm commops:deliverability:check:write
pnpm commops:substrate:populate:dry-run
pnpm commops:substrate:readiness:write
```

## SM populate (Class A keys for `--apply`)

```bash
pnpm commops:substrate:populate:dry-run
## export SENDGRID_API_KEY, AFRICASTALKING_* , TWILIO_* then:
pnpm commops:substrate:populate
```

## Open P1

None — deliverability ingress sealed (`COMMOPS-F3` done).
