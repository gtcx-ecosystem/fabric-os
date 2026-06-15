---
title: 'PayOps — payment execution'
status: current
date: 2026-06-14
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
initiative: INIT-GTCX-SERVICE-FABRIC
---

# PayOps — payment execution

> **Ops lane:** **PayOps** · **Not RevOps** — RevOps is the CRO office (pricing, economics, GTM revenue strategy).

**Fleet registry:** `bridge-os/pm/spec/payops-domain-registry.json`  
**Substrate contract:** `pm/payops-substrate-contract.json`  
**Friction SoR:** `pm/payops-friction-register.json`  
**Forensic inventory:** `audit/ecosystem-revops-commops-forensic-2026-06-14.md`

## Substrate contract (SM + webhooks)

| Provider        | Staging SM path                          | Production SM path                          |
| --------------- | ---------------------------------------- | ------------------------------------------- |
| **Stripe**      | `gtcx/shared/staging/payops/stripe`      | `gtcx/shared/production/payops/stripe`      |
| **Flutterwave** | `gtcx/shared/staging/payops/flutterwave` | `gtcx/shared/production/payops/flutterwave` |

**Legacy migrate:** `gtcx/terminal-os/{staging,production}/api-keys` → shared payops paths.

Webhook ingress matrix lives in `pm/payops-substrate-contract.json#webhookIngress` and [`infra-per-repo-action-matrix`](../coordination/infra-per-repo-action-matrix-2026-06-05.md#payops-webhook-ingress-matrix).

**Open P0:** `PAY-FLEET-01` / `PAY-FLEET-02` — consolidate live Stripe/Flutterwave consumers onto substrate (structural contract done; execution pending).

## Owns

- Shared billing **substrate** (fabric): Stripe/Flutterwave SM paths, webhook ingress, metering witness
- **Domain execution** (product repos): checkout UX, capital calls, escrow, M-Pesa, wire settlement

## Does not own

- Pricing strategy, unit economics, revenue analytics → **RevOps**
- GTM / LOI / pilot commercial motion → **RevOps** (GTMaaS register)

## Operator entry

```bash
pnpm payops:providers:check
pnpm payops:providers:check:write
cat pm/payops-friction-register.json
```

**CORE module:** [core.md](../core-ops/batch-a/core.md#payops)
