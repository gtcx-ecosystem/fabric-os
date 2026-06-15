---
title: 'RevOps — CRO office'
status: current
date: 2026-06-14
owner: bridge-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
initiative: INIT-GTCX-SERVICE-FABRIC
---

# RevOps — CRO office (revenue strategy)

> **Ops lane:** **RevOps** · **Functional product:** **GTMaaS** (GTM revenue track)  
> **Legacy:** BizOps display name → RevOps (2026-06-14)

**GTM friction SoR:** `pm/gtm-friction-register.json`  
**Economics friction SoR:** `pm/revops-friction-register.json`  
**Operator doc (GTMaaS):** [gtm-as-a-service.md](./gtm-as-a-service.md)

## Owns

- Pricing strategy and tier design
- Unit economics and revenue analytics
- GTM revenue motion, pilot revenue witnesses
- Business-model economics in PRD / product-goals

## Does not own

- Stripe keys, webhooks, checkout implementation → **PayOps**
- Cloud/token spend attribution → **FinOps** (feeds RevOps economics)

## Operator entry

```bash
cat pm/gtm-friction-register.json
cat pm/revops-friction-register.json
pnpm ecosystem:fabric:check   # from bridge-os cwd sibling
```

**CORE module:** [core.md](./core.md#revops)
