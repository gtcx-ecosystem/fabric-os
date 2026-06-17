---
title: 'Outbound — CommOps fleet substrate migration (COMMOPS-F2)'
status: open
date: 2026-06-17
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
from: fabric-os
to: terra-os, nyota-ai, sensei-os
ticket: XR-FABRIC-COMMOPS-001
protocol: P24
priority: P0
blocksIR: false
initiative: INIT-OPS-LANES-OPERATIONALIZE
---

# CommOps fleet substrate migration — P24 handoff

## Raise

fabric-os is consolidating communications provider custody onto shared CommOps SM paths. Product repos consume keys via **ESO** — not repo-local `app-secrets` slots.

| Field       | Value                                                     |
| ----------- | --------------------------------------------------------- |
| Friction    | `COMMOPS-F2`                                              |
| Contract    | `fabric-os/pm/commops-substrate-contract.json`            |
| SM populate | `platform/scripts/staging/populate-commops-staging-sm.sh` |
| Harness     | `pnpm commops:substrate:readiness:write`                  |

## Shared SM paths (staging)

| Channel      | Provider         | Path                                          |
| ------------ | ---------------- | --------------------------------------------- |
| Email        | SendGrid         | `gtcx/shared/staging/commops/sendgrid`        |
| SMS          | Africa's Talking | `gtcx/shared/staging/commops/africas-talking` |
| SMS/WhatsApp | Twilio           | `gtcx/shared/staging/commops/twilio`          |

## Pilot cutover (done in terra-os)

| Repo         | Action                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| **terra-os** | ESO `terraos-secrets-staging.yaml` — sendgrid + AT from shared CommOps |

## Fleet rollout (owner repo — Class R)

| Repo          | Channels            | Action                                          |
| ------------- | ------------------- | ----------------------------------------------- |
| **nyota-ai**  | Twilio WhatsApp/SMS | ESO from `gtcx/shared/staging/commops/twilio`   |
| **sensei-os** | Email (amani-email) | ESO from `gtcx/shared/staging/commops/sendgrid` |

## fabric-os done (this handoff)

- Substrate contract + populate script (dry-run default; `--apply` after Class A keys)
- Terraform SM shells: `deploy/terraform/modules/secrets/commops.tf`
- Pilot ESO reference: `deploy/kubernetes/overlays/staging/terra-os/external-secret-commops-sendgrid.yaml`
- Readiness harness: `pnpm commops:substrate:readiness:write`

## Acceptance (per repo)

1. Deployment `envFrom` / ESO references shared CommOps SM paths (not app-local comm keys).
2. Staging notification smoke passes with substrate keys.
3. Record evidence path in repo `audit/evidence/` or coordination ack.
