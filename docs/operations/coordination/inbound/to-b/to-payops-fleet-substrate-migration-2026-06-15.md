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

fabric-os is consolidating **Stripe** and **Flutterwave** provider custody onto shared PayOps SM paths. Product repos must consume keys via **ESO** from fabric substrate — not repo-local secrets.

| Field       | Value                                                    |
| ----------- | -------------------------------------------------------- |
| Friction    | `PAY-FLEET-01`, `PAY-FLEET-02`                           |
| Contract    | `fabric-os/pm/payops-substrate-contract.json`            |
| SM populate | `platform/scripts/staging/populate-payops-staging-sm.sh` |
| Harness     | `pnpm payops:substrate:readiness:write`                  |

## Shared SM paths (staging)

| Provider    | Path                                     |
| ----------- | ---------------------------------------- |
| Stripe      | `gtcx/shared/staging/payops/stripe`      |
| Flutterwave | `gtcx/shared/staging/payops/flutterwave` |

**Legacy migrate:** `gtcx/terminal-os/staging/api-keys` → shared stripe path (terminal-os first consumer).

## Per-repo actions (owner repo — Class R)

| Repo              | Provider    | Webhook path              | `substrateConsumer` | Action                                                |
| ----------------- | ----------- | ------------------------- | ------------------- | ----------------------------------------------------- |
| **terminal-os**   | stripe      | `/api/stripe/webhook`     | `true`              | Wire ESO to shared path; deprecate legacy SM          |
| **sensei-os**     | stripe      | `/stripe-webhook`         | pending → **true**  | ESO + remove local stripe service keys                |
| **compliance-os** | stripe      | `/billing/stripe/webhook` | pending → **true**  | ESO from shared path in caas billing                  |
| **nyota-ai**      | stripe      | `/webhooks/stripe`        | pending → **true**  | Migrate `services/stripe_billing.py` to substrate env |
| **griot-ai**      | flutterwave | `/webhooks/flutterwave`   | pending → **true**  | ESO + billing route uses shared flutterwave SM        |

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
