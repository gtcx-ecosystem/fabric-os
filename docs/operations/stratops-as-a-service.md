---
title: StratOps — strategy and enterprise-building
status: current
date: 2026-06-14
owner: bridge-os
initiative: INIT-GTCX-EXECUTION-ENGINE
---

# StratOps — strategy and enterprise-building

> **Ops lane:** **StratOps** · **Functional product:** **StratAAS** (strategy-as-a-service)  
> **Coordinates with:** ProductOps (per-repo PRD/milestones), FleetOps (P22 execution), RevOps (CRO economics)

**Strategy registry SoR:** `bridge-os/pm/spec/stratops-strategy-registry.json`  
**Friction SoR:** `bridge-os/pm/spec/stratops-friction-register.json`

## Owns

- Company and fleet **north star** — vision, GR-T2 integrator pilot, continental capital narrative
- **Company / product roadmap** at fleet level — live programmes, execution-engine graph, trade-domain lanes
- **Partnerships** — coalition structure, enterprise/government pilot readiness, institutional intelligence
- **Enterprise-building** — pilot DoD template, milestone semantics, long-horizon goals and definitions of done
- **Goal orientation** — every session traces work to north star, milestone, or programme head

## Does not own

- Per-repo PRD index and `product-goals.json` → **ProductOps**
- P22 next-story selection and witness rollups → **FleetOps**
- Pricing, unit economics, GTM revenue motion → **RevOps**
- Payment checkout and provider keys → **PayOps**
- Institutional persona canon text → **canon-os** (StratOps consumes, does not author constitution)

## StratOps vs ProductOps vs FleetOps vs RevOps

|                  | **StratOps**                                              | **ProductOps**                         | **FleetOps**           | **RevOps**                       |
| ---------------- | --------------------------------------------------------- | -------------------------------------- | ---------------------- | -------------------------------- |
| **Horizon**      | Years → quarters (fleet north star)                       | Quarters → sprints (repo milestone)    | Now (next story)       | Quarters (revenue economics)     |
| **Question**     | _Where are we going and with whom?_                       | _What are we building this milestone?_ | _What runs next?_      | _How do we make money?_          |
| **Examples**     | `ecosystem-fleet-goals-registry`, `fleet-live-programmes` | `prd-index`, `product-goals`           | `pnpm agent:next-work` | `gtm-friction-register`, pricing |
| **Partnerships** | Coalition, enterprise pilot, government rail              | Pilot feature scope in PRD             | Intake tickets only    | LOI/DTF revenue witnesses        |

## Operator entry

```bash
# From bridge-os (canonical clarity report)
pnpm ecosystem:clarity:report:write

# From fabric-os (structural StratOps gate)
pnpm stratops:strategy:check:write
```

**CORE module:** [core.md](./core.md#stratops)
