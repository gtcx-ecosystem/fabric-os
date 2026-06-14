---
title: Fleet forensic audit — RevOps, billing, payments, communications
status: current
date: 2026-06-14
owner: fabric-os
auditClass: ecosystem-forensic
scope: 16-repo fleet + gtcx-os monorepo shadows
method: ripgrep provider/env/code scan + implementation file trace (not sample repos)
---

# Fleet forensic audit — RevOps · billing · payments · communications

> **Correction:** Prior analysis sampled fabric-os, terra-os, and terminal-os only. This audit covers the **full GTCX fleet** per `bridge-os/pm/spec/ecosystem-repo-aliases.json` and the 16-repo assurance stress set.

## Executive summary

| Finding                                                                                              | Severity | Evidence                                                                 |
| ---------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| **No fleet RevOps/CommOps module** — fabric owns deploy secrets, not billing/comms substrate         | P0       | `service-fabric.json` has P41/P42 only; RevOps/CommOps `planned` in CORE |
| **5+ independent Stripe integrations** across product repos                                          | P0       | terminal-os, sensei-os, nyota-ai, compliance-os, gtcx-os mobile billing  |
| **3+ SMS/email provider stacks** (SendGrid, Africa's Talking, Twilio) duplicated                     | P0       | terra-os, nyota-ai, sensei-os (amani-email), canon historical amani      |
| **Flutterwave** as second payment rail (griot-ai, gtcx-os mobile) — no fabric registry               | P1       | `griot-ai/platform/.../flutterwave.js`                                   |
| **markets-os** owns trade/capital-call payments (wire, escrow, authority) — **PayOps**, not RevOps   | —        | fund-api, custody-api — 100+ payment surfaces                            |
| **compliance-os** Stripe Invoicing is most production-shaped SaaS billing                            | —        | `caas/src/lib/billing.ts` + DPA subprocessor mention                     |
| **terra-os** has strongest **CommOps code** (provider abstraction) but **per-repo secrets**          | P1       | `notification_providers.py`                                              |
| **ledger-ui / veritas-ai / exploration-os** — UI or protocol webhooks only; no SaaS billing provider | —        | templates, expo-notifications, TradePass webhooks                        |
| **canon-os / agile-os / bridge-os** — strategy & partnership refs only (Flutterwave, AT, Twilio)     | —        | decks, audits, tool-scout Resend                                         |
| **fabric-os** — terminal SM paths include stripe key slot; **no shared comm/billing SM contract**    | P1       | `gtcx/terminal-os/{staging,production}/api-keys`                         |

**Verdict:** Fabric **should** own RevOps + CommOps **substrate** (keys, webhooks, DPAs, fleet checks). Product repos own **domain money flows** (SaaS tier, concession fee, capital call, settlement). Centralization is justified by **provider duplication**, not by merging terra payments with terminal Stripe.

---

## Methodology

1. **Fleet scope:** bridge-os, fabric-os, baseline-os, canon-os, agile-os, compliance-os, exploration-os, griot-ai, gtcx-os, ledger-ui, markets-os, nyota-ai, sensei-os, terminal-os, terra-os, veritas-ai (`gtcx-markets` = markets-os alias).
2. **Signals scanned:** `STRIPE_*`, `SENDGRID_*`, `TWILIO_*`, `AT_*` / Africa's Talking, `RESEND_*`, Flutterwave, M-Pesa, PAPSS, `billing.ts|py`, `notifications.ts|py`, webhook routes, `.env.example`, AWS SM/terraform secrets.
3. **Excluded:** `node_modules`, `archive/**` (noted separately when sole evidence), lighthouse artifacts, generic "Africa" GTM prose without provider binding.
4. **Classification:** Implementation **LIVE** (code + env), **PARTIAL** (graceful degrade / stub), **DOCS** (roadmap only), **NONE**.

---

## Taxonomy (forensic)

### Revenue types (do not conflate)

| Class                         | Owner repos                                               | Provider examples                           | Ops lane                   |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------- | -------------------------- |
| **SaaS subscription**         | terminal-os, sensei-os, nyota-ai, compliance-os, griot-ai | Stripe, Flutterwave                         | **RevOps**                 |
| **Usage / invoicing**         | compliance-os, gtcx-os veritas (tier math only)           | Stripe Invoicing                            | **RevOps**                 |
| **Gov / concession fees**     | terra-os                                                  | M-Pesa stub, manual record                  | **PayOps** (product)       |
| **Trade / capital formation** | markets-os                                                | Wire, escrow, authority URL, custody ledger | **PayOps** (product)       |
| **Marketplace payout**        | gtcx-os `@gtcx/billing`                                   | Stripe Connect, Flutterwave                 | **RevOps** + product split |
| **In-app only**               | compliance-os, ledger-ui                                  | AuditLog notifications — no external send   | Product                    |
| **Protocol webhooks**         | veritas-ai, nyota-ai, terminal-os                         | HMAC webhooks — not billing                 | SecOps ingress             |

---

## Fleet matrix — billing & payments

| Repo               | Implementation             | Provider / pattern                                                                                        | Key paths                                                                                      | Fabric SM?                                      |
| ------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **terminal-os**    | **LIVE**                   | Stripe Checkout + webhook                                                                                 | `platform/web/lib/stripe/*`, `app/api/stripe/webhook/route.ts`                                 | **Yes** — `gtcx/terminal-os/*/api-keys` via ESO |
| **sensei-os**      | **LIVE**                   | Stripe billing + webhook                                                                                  | `platform/apps/api/src/services/stripe.ts`, `routes/stripe-webhook.ts`, `routes/v1/billing.ts` | No fleet contract                               |
| **nyota-ai**       | **LIVE**                   | Stripe + Twilio WhatsApp                                                                                  | `services/stripe_billing.py`, `routes/whatsapp_twilio.py`, `routes/billing.py`                 | No                                              |
| **compliance-os**  | **LIVE**                   | Stripe REST Invoicing (no SDK)                                                                            | `platform/services/caas/src/lib/billing.ts`, `api/settings/billing/*`                          | No                                              |
| **griot-ai**       | **LIVE**                   | **Flutterwave** subscriptions                                                                             | `platform/src/api/routes/billing.ts`, `billing/flutterwave.js`                                 | No                                              |
| **terra-os**       | **PARTIAL**                | Payments table + outstanding calc; mobile money **STUB**                                                  | `platform/app/api/payments.py`, `services/mobile_money.py`                                     | No                                              |
| **markets-os**     | **LIVE** (trade)           | Capital calls, escrow, settlements, wire PDFs — **not Stripe**                                            | `fund-api/.../capital-calls.ts`, `custody-api/.../settlements.ts`, portal payment drafts       | No — domain PayOps                              |
| **gtcx-os**        | **PARTIAL**                | `@gtcx/billing` revenue share + Stripe Connect / Flutterwave payout scheduler; veritas tier **math only** | `platform/mobile/.../packages/billing/`, `platforms/.../veritas/.../billing.service.ts`        | Monorepo shadow — split across extracted repos  |
| **exploration-os** | **DOCS/UI**                | Checkout UX, financing steps — no provider integration in platform                                        | mobile-v2 checkout components                                                                  | No                                              |
| **veritas-ai**     | **NONE** (billing)         | Roadmap: metering hooks; webhook server for TradePass                                                     | `engine/.../run-webhook-server.js`                                                             | No                                              |
| **ledger-ui**      | **NONE**                   | Billing **templates** only (design system)                                                                | `platform/packages/pages/src/billing`                                                          | No                                              |
| **fabric-os**      | **NONE** (product billing) | Terraform AWS billing mode refs only                                                                      | `deploy/terraform/modules/secrets/terminal-os.tf`                                              | **Infra** custody for terminal keys             |
| **bridge-os**      | **NONE**                   | Resend in tool-scout GTM creative eval                                                                    | `pm/spec/agent-tool-scout-gtm-creative.json`                                                   | No                                              |
| **baseline-os**    | **NONE** (product)         | CI/GitHub **billing** ops pain; enterprise pricing doc                                                    | `docs/operations/compliance/unblock-instructions`                                              | No                                              |
| **canon-os**       | **DOCS**                   | Stripe/Twilio benchmarks, subprocessor templates, partnership decks                                       | `docs/reference/guides/agentic-architecture-integration.md`                                    | No                                              |
| **agile-os**       | **DOCS**                   | Flutterwave, Africa's Talking partnership audits                                                          | archive master-audits                                                                          | No                                              |

### Stripe duplication forensic

| Repo          | Webhook route          | Checkout / portal         | Tests     | Prod-shaped     |
| ------------- | ---------------------- | ------------------------- | --------- | --------------- |
| terminal-os   | `api/stripe/webhook`   | checkout route + tier-map | yes       | yes             |
| sensei-os     | `stripe-webhook.ts`    | billing routes            | extensive | yes             |
| nyota-ai      | stripe_billing service | tier price map            | yes       | yes             |
| compliance-os | via Stripe API         | invoice settings API      | yes       | yes (invoicing) |

**Risk:** Four separate webhook signing secrets, four PCI SAQ boundary narratives, four DPA subprocessors entries unless LegalOps centralizes.

---

## Fleet matrix — communications

| Repo               | Email                                      | SMS                               | Push / chat                     | Implementation                                   |
| ------------------ | ------------------------------------------ | --------------------------------- | ------------------------------- | ------------------------------------------------ |
| **terra-os**       | **SendGrid** (`SendGridEmailProvider`)     | **Africa's Talking**              | in-app AuditLog                 | **LIVE** — `notification_providers.py`           |
| **nyota-ai**       | —                                          | **Twilio** WhatsApp + SMS routes  | —                               | **LIVE** — webhook sig verify                    |
| **sensei-os**      | **amani-email** routes (`/v1/amani/email`) | —                                 | webhook-service                 | **LIVE** — separate from Stripe                  |
| **compliance-os**  | **NONE external**                          | —                                 | in-app notifications (AuditLog) | Product-only                                     |
| **exploration-os** | —                                          | —                                 | **expo-notifications**          | **LIVE** — device push only                      |
| **terminal-os**    | —                                          | —                                 | breaking-protocol push (docs)   | **DOCS**                                         |
| **markets-os**     | —                                          | WhatsApp surface docs             | —                               | **DOCS** (`docs/reference/surfaces/whatsapp.md`) |
| **ledger-ui**      | —                                          | —                                 | toast / notification UI         | **UI only**                                      |
| **fabric-os**      | —                                          | —                                 | Slack webhook env placeholders  | **DOCS** (`.env.example` incident)               |
| **bridge-os**      | **Resend** (scout candidate)               | —                                 | —                               | **PLANNED** eval only                            |
| **canon-os**       | templates                                  | Twilio/AT in archived amani specs | —                               | **NORMATIVE** / historical                       |

### terra-os CommOps detail (strongest abstraction)

- `notification_providers.py` — pluggable SMS/Email with log-only fallback.
- Env: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `AT_USERNAME`, `AT_API_KEY` (`.env.example`).
- Tests: `test_notification_providers.py`, `test_services_notifications.py`.
- **Gap:** credentials are app-local; not in fabric shared SM; no fleet deliverability witness.

### nyota-ai CommOps detail

- `.env.example`: full Twilio WhatsApp block.
- `routes/webhook.py` — Twilio/Meta signature verification.
- USSD + webhook API surface (`AGENTS.md`).

---

## Webhook & ingress forensic

| Repo          | Webhook type                             | Auth                  | Fabric ingress card            |
| ------------- | ---------------------------------------- | --------------------- | ------------------------------ |
| terminal-os   | Stripe                                   | signing secret        | staging host via fabric deploy |
| sensei-os     | Stripe                                   | stripe webhook secret | unknown/shared                 |
| nyota-ai      | Twilio/Meta                              | signature verify      | product-owned                  |
| griot-ai      | Flutterwave                              | secret hash           | product-owned                  |
| veritas-ai    | TradePass/GCI                            | RFC 9421 + schema     | engine server                  |
| compliance-os | — (Stripe inbound N/A in REST invoicing) | —                     | —                              |
| fabric-os     | Slack incident (optional)                | —                     | not standardized               |

**Finding:** No **fleet webhook matrix** in `infra-per-repo-action-matrix` for `/webhooks/stripe|twilio|flutterwave`.

---

## Secrets & custody forensic

| Secret class          | Current SoR                | Repos affected          |
| --------------------- | -------------------------- | ----------------------- |
| Terminal API + Stripe | **fabric-os** AWS SM + ESO | terminal-os             |
| Terra SendGrid/AT     | **terra-os** env / deploy  | terra-os                |
| Sensei Stripe + email | **sensei-os** env          | sensei-os               |
| Nyota Twilio + Stripe | **nyota-ai** env           | nyota-ai                |
| Compliance Stripe     | **compliance-os** env      | compliance-os           |
| Griot Flutterwave     | **griot-ai** env           | griot-ai                |
| Intelligence/auth     | **fabric-os** SM module    | gtcx-intelligence paths |

**Fabric touches RevOps today only indirectly** — terminal-os SM module. No `gtcx/shared/{staging,prod}/rev/*` or `gtcx/shared/.../comm/*` paths.

---

## Service fabric & Ops engine alignment

| Service             | Status in `service-fabric.json` | Fleet reality                             |
| ------------------- | ------------------------------- | ----------------------------------------- |
| P41 DevOps/InfraOps | complete                        | terminal ESO — partial RevOps custody     |
| P42 SecOps          | complete                        | webhook WAF not per-provider              |
| RevOps              | **missing**                     | 5 Stripe + 1 Flutterwave implementations  |
| CommOps             | **missing**                     | 3 provider stacks                         |
| GTMAAS              | planned                         | partnership refs in canon/agile           |
| LegalOps            | planned                         | DPA mentions Stripe in compliance-os only |

---

## Centralization forensic recommendation

### Centralize in fabric (RevOps + CommOps engines)

1. **Provider registry** — Stripe (accounts per env), SendGrid, Africa's Talking, Twilio, Resend, Flutterwave — with owner repo consumption map.
2. **SM path contract** — e.g. `gtcx/shared/staging/rev/stripe`, `gtcx/shared/staging/comm/sendgrid`.
3. **Webhook ingress matrix** — extend infra-per-repo-action-matrix.
4. **Env name contract** — gtcx-protocols / Protocol 19 alignment (single `STRIPE_WEBHOOK_SECRET` naming).
5. **Fleet harness** — `revops:providers:check`, `commops:deliverability:check`.
6. **LegalOps subprocessor index** — one SoR linking compliance-os DPA + fleet vendors.

### Keep in product repos (PayOps / engineering)

| Repo          | Keep local                                                                |
| ------------- | ------------------------------------------------------------------------- |
| markets-os    | Capital calls, escrow, settlement orchestration, wire instructions        |
| terra-os      | Concession fee schedules, jurisdiction payments, M-Pesa integration logic |
| terminal-os   | Tier UX, checkout flow, entitlement unlock                                |
| compliance-os | Invoice line items from tenant usage                                      |
| griot-ai      | Flutterwave plan amounts (until RevOps abstracts provider)                |

### Do not merge

- **markets-os trade payments** into Stripe RevOps — different regulatory and authority model (`GTX_MARKETS_CAPITAL_CALL_PAYMENT_AUTHORITY_URL`).
- **terra-os gov fees** into terminal SaaS Stripe — different buyer and reconciliation.

---

## P0–P2 findings register

| ID            | Sev | Finding                                                                           | Owner                    |
| ------------- | --- | --------------------------------------------------------------------------------- | ------------------------ |
| REV-FLEET-01  | P0  | Five Stripe integrations without shared webhook/secret contract                   | fabric-os RevOps         |
| COMM-FLEET-01 | P0  | SendGrid + AT + Twilio implemented 3×; no deliverability SoR                      | fabric-os CommOps        |
| REV-FLEET-02  | P0  | Flutterwave (griot) + Stripe (4 repos) — dual SaaS rails unregistered             | fabric RevOps            |
| FABRIC-01     | P1  | Fabric SM only documents terminal-os; terra/sensei/nyota/compliance/griot absent  | fabric InfraOps          |
| LEGAL-01      | P1  | Subprocessor list not fleet-unified for Stripe/Twilio/SendGrid/Flutterwave        | LegalOps + compliance-os |
| GTCX-OS-01    | P1  | `gtcx-os` monorepo still holds billing package — extraction drift risk            | bridge + product repos   |
| TERRA-01      | P2  | M-Pesa/mobile_money still STUB — PayOps not production                            | terra-os                 |
| MKT-01        | —   | markets-os payment surface is trade-domain — classify PayOps not RevOps           | markets-os               |
| DOC-01        | P2  | canon/agile partnership docs reference AT/Flutterwave without fleet registry link | canon-os                 |

---

## Next forensic actions (Class R)

1. **Provider inventory script** — `platform/scripts/revops-fleet-provider-inventory.mjs` scanning all 16 repos → `audit/evidence/revops-fleet-inventory-latest.json`.
2. **Extend CORE** — wire RevOps/CommOps from `planned` → `active` with friction registers.
3. **DPA sweep** — compliance-os `dpa-template.md` + canon subprocessor templates → fleet register.
4. **Webhook matrix PR** — fabric `infra-per-repo-action-matrix` addendum.

---

## Related artifacts

- [ops-programs.md](../operations/ops-programs.md)
- [core.md](../operations/core.md)
- `bridge-os/pm/spec/ops-programs-registry.json`
- `bridge-os/pm/spec/service-fabric.json`
- terra-os `docs/specs/ga-readiness-audit.md` § notifications + payments
- compliance-os `platform/services/caas/src/lib/billing.ts`
