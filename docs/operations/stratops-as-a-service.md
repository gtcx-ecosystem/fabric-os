---
title: 'StratOps — strategy and enterprise-building'
status: current
date: 2026-06-14
owner: bridge-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
initiative: INIT-GTCX-EXECUTION-ENGINE
---

# StratOps — strategy and enterprise-building

> **Ops lane:** **StratOps** · **Functional product:** **StratAAS** (strategy-as-a-service)  
> **Coordinates with:** ProductOps (per-repo PRD/milestones), **EcosystemOps** (partners/dev/community programs), FleetOps (P22 execution), RevOps (tactical CRO economics)

**Strategy registry SoR:** `bridge-os/pm/spec/stratops-strategy-registry.json`  
**Friction SoR:** `bridge-os/pm/spec/stratops-friction-register.json`

## Strategic focus

StratOps owns **where the company compounds** — not how a single repo ships next week.

| Pillar                 | Question                                                | StratOps owns                                                                                 | RevOps / ProductOps own                             |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Growth**             | How do pilots become production and distribution scale? | GR-T2 → sovereign trajectory, partnership-led expansion _(programs → **EcosystemOps**)_       | Tier pricing, checkout, monthly revenue rollup      |
| **Scale**              | How do we add lanes/repos without linear ops cost?      | CORE + service-fabric thesis, fleet programme capacity, agentic throughput at ecosystem scope | Per-repo sprint execution, deploy apply             |
| **Economies of scale** | Where does marginal cost fall as the fleet grows?       | Shared substrate leverage (DaaS, SECaaS, PayOps, StratAAS), unified economics _frame_         | AWS line items, Stripe wiring, CAC/LTV spreadsheets |
| **Sustainability**     | Can we grow without burning trust or margin?            | Trust-speed duality, bank-grade brand durability, institutional evidence (not chat memory)    | —                                                   |
| **Moats**              | What is defensible for years?                           | Company moat registry, continental stack narrative, CORE innovation moat rollup               | Single-feature UX, one-repo security patch          |

Machine registry: `strategicPillars` in `stratops-strategy-registry.json`.

## Owns

- **Growth** — fleet north star, integrator pilot → production path _(partner enablement → **EcosystemOps**)_
- **Scale** — company/product roadmap at fleet level, live programmes, execution-engine graph
- **Economies of scale** — why shared CORE beats per-repo ops; marginal cost story for investors and product leads
- **Sustainability** — durable operating model (business + institutional), enterprise pilot DoD, goal orientation
- **Moats** — defensibility narrative wired to CORE `innovationMoat` pillars
- **Partnerships** — coalition priority at strategy level; enablement → **EcosystemOps**
- **Enterprise-building** — milestone semantics, long-horizon goals and definitions of done

## Does not own

- Per-repo PRD index and `product-goals.json` → **ProductOps**
- P22 next-story selection and witness rollups → **FleetOps**
- Pricing tactics, unit economics models, GTM revenue motion → **RevOps** (inside StratOps frame)
- Payment checkout and provider keys → **PayOps**
- Lane-level CORE execution → **InfraOps / DevOps / SecOps** (StratOps sets why; CORE runs how)
- Institutional persona canon text → **canon-os** (StratOps consumes, does not author constitution)

## StratOps vs RevOps (strategy vs CRO)

|               | **StratOps**                                                        | **RevOps**                                                          |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Horizon**   | Years → quarters                                                    | Quarters → months                                                   |
| **Economics** | Economies of scale, margin _thesis_, sustainable growth             | Unit economics, pricing, revenue analytics, pilot revenue witnesses |
| **Moats**     | Company-level defensibility registry                                | Proof-first GTM revenue motion (GTMaaS)                             |
| **Example**   | "Shared PayOps substrate lowers marginal cost per new SaaS product" | "Terminal tier-2 price point and time-to-first-dollar"              |

## StratOps vs ProductOps vs FleetOps

|                 | **StratOps**                                 | **ProductOps**                         | **FleetOps**      |
| --------------- | -------------------------------------------- | -------------------------------------- | ----------------- |
| **Question**    | _Where are we going and how do we compound?_ | _What are we building this milestone?_ | _What runs next?_ |
| **Growth link** | Programme heads, north star, moat story      | PRD + shippable DoD                    | P22 selection     |

## Operator entry

```bash
## Fleet clarity — north star + programmes + pillar trace
pnpm ecosystem:clarity:report:write

## Structural StratOps gate (pillars + programme map)
pnpm stratops:strategy:check:write
```

**CORE module:** [core.md](./core.md#stratops) · **Innovation moat rollup:** [core.md](./core.md#innovation-moat)
