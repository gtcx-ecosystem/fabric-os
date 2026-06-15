---
title: 'Outbound — PayOps fleet substrate migration (PAY-FLEET-01/02)'
status: open
date: 2026-06-15
owner: fabric-os
tier: operating
from: fabric-os
to: terminal-os, sensei-os, compliance-os, nyota-ai, griot-ai
ticket: XR-FABRIC-PAYOPS-001
protocol: P24
priority: P0
blocksIR: false
initiative: INIT-GTCX-SERVICE-FABRIC
---

# PayOps fleet substrate migration — P24 handoff

## Raise

fabric-os is consolidating billing provider custody onto shared PayOps SM paths with **Flutterwave primary** and **Stripe secondary**. Product repos consume keys via **ESO** — not repo-local secrets.

| Field       | Value                                                    |
| ----------- | -------------------------------------------------------- |
| Friction    | `PAY-FLEET-01`, `PAY-FLEET-02`                           |
| Contract    | `fabric-os/pm/payops-substrate-contract.json`            |
| Priority    | **Flutterwave primary** · **Stripe secondary**           |
| SM populate | `platform/scripts/staging/populate-payops-staging-sm.sh` |
| Harness     | `pnpm payops:substrate:readiness:write`                  |

## Shared SM paths (staging)

| Rail        | Provider    | Path                                     |
| ----------- | ----------- | ---------------------------------------- |
| **Primary** | Flutterwave | `gtcx/shared/staging/payops/flutterwave` |
| Secondary   | Stripe      | `gtcx/shared/staging/payops/stripe`      |

**Env routing:** `PAYOPS_PRIMARY_PROVIDER=flutterwave` · `PAYOPS_SECONDARY_PROVIDER=stripe`

## Per-repo actions (owner repo — Class R)

| Repo              | Primary (Flutterwave)    | Secondary (Stripe)        | Action                                       |
| ----------------- | ------------------------ | ------------------------- | -------------------------------------------- |
| **terminal-os**   | `/webhooks/flutterwave`  | `/api/stripe/webhook`     | ESO both rails; checkout prefers Flutterwave |
| **sensei-os**     | `/flutterwave-webhook`   | `/stripe-webhook`         | ESO both rails                               |
| **compliance-os** | `/billing/flutterwave/…` | `/billing/stripe/webhook` | caas envFrom primary then secondary          |
| **nyota-ai**      | `/webhooks/flutterwave`  | `/webhooks/stripe`        | Migrate billing service to substrate env     |
| **griot-ai**      | `/webhooks/flutterwave`  | `/webhooks/stripe`        | ESO wired — use `FLUTTERWAVE_SECRET_HASH`    |

## fabric-os done (this handoff)

- Substrate contract + webhook matrix (`PAY-SUB-01/02` closed)
- SM populate script (dry-run default; `--apply` after Class A keys)
- Metering witness scaffold: `audit/evidence/payops-metering-rollup-latest.json`
- Fleet inventory harness: `pnpm payops:providers:check:write`

## Acceptance (per repo)

1. ExternalSecret references `gtcx/shared/{staging,production}/payops/{stripe|flutterwave}`
2. `substrateConsumer: true` in substrate contract webhook row (fabric-os updates on ack)
3. `pnpm payops:providers:check:write` in fabric-os shows **≤1** live stripe integration OR repo marked migrated with evidence path

## Forbidden

- Duplicating Stripe secret keys in product `pm/` or git
- Blocking engineering roadmap on billing migration (`blocksIR: false`)

## Ack template

Owner repo: `docs/operations/coordination/from-<repo>-payops-substrate-ack-2026-06-15.md` with ESO manifest path + probe exit code.
