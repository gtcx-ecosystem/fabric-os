---
title: EcosystemOps — partnerships, developer engagement, and network growth
status: current
date: 2026-06-14
owner: bridge-os
initiative: INIT-GTCX-EXECUTION-ENGINE
---

# EcosystemOps — partnerships, developer engagement, and network growth

> **Ops lane:** **EcosystemOps** · **Functional product:** **EcosystemAAS**  
> **Publish / onboarding surfaces:** **ecosystem-os** · **Strategy frame:** **StratOps** · **Partner revenue:** **RevOps**

**Network registry SoR:** `bridge-os/pm/spec/ecosystemops-network-registry.json`  
**Friction SoR:** `bridge-os/pm/spec/ecosystemops-friction-register.json`

## Owns

- **Partnerships** — integrator, bank, government, and technology coalition enablement (not LOI countersign)
- **Product ecosystem growth** — partner tiers, certification paths, lane-aware enablement kits
- **Developer engagement** — API programs, SDK/sandbox index, integrator quickstarts, DevRel cadence
- **Communities** — champions, forums, open-source contribution paths, community training witnesses
- **Fleet publish surfaces** — coordinates with **ecosystem-os** GitBook/onboarding (does not duplicate canon protocols)

## Does not own

- Growth thesis, moats, economies-of-scale narrative → **StratOps**
- LOI/DTF, pilot revenue economics, tier pricing → **RevOps** (GTMaaS)
- PRD and shippable milestone DoD → **ProductOps**
- Protocol text and audit methodology → **canon-os**
- Legal partner agreement countersign → **LegalOps** / **agile-os** (Class S)

## EcosystemOps vs StratOps vs RevOps

|                | **EcosystemOps**                                               | **StratOps**                                             | **RevOps**                                                |
| -------------- | -------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| **Question**   | _Who do we grow the network with and how do they build on us?_ | _Why does partnership-led distribution compound growth?_ | _What commercial terms and revenue do partners generate?_ |
| **Horizon**    | Quarters (programs running)                                    | Years (growth + moat thesis)                             | Quarters (CRO economics)                                  |
| **Examples**   | Partner enablement kit, dev portal index, community champions  | `strategicPillars.growth`, programme-lane map            | `gtm-friction-register`, LOI witness                      |
| **Owner repo** | bridge-os register + **ecosystem-os** publish                  | bridge-os                                                | bridge-os + fabric register host                          |

## Operator entry

```bash
pnpm ecosystemops:network:check:write
pnpm ecosystem:clarity:report:write   # from bridge-os — programmes + partner context
```

**CORE module:** [core.md](./core.md#ecosystemops)
