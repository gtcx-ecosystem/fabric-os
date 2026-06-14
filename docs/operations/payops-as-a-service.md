---
title: PayOps — payment execution
status: current
date: 2026-06-14
owner: fabric-os
initiative: INIT-GTCX-SERVICE-FABRIC
---

# PayOps — payment execution

> **Ops lane:** **PayOps** · **Not RevOps** — RevOps is the CRO office (pricing, economics, GTM revenue strategy).

**Fleet registry:** `bridge-os/pm/spec/payops-domain-registry.json`  
**Friction SoR:** `pm/payops-friction-register.json`  
**Forensic inventory:** `audit/ecosystem-revops-commops-forensic-2026-06-14.md`

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

**CORE module:** [core.md](./core.md#payops)
