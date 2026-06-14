---
title: GTCX Ops programs — DevOps, SecOps, InfraOps, MLOps, AIOps, StratOps, EcosystemOps, ProductOps, DesignOps, HROps, RevOps, PayOps
status: current
date: 2026-06-14
owner: fabric-os
---

# GTCX Ops programs

> **Operator vocabulary:** **DevOps**, **SecOps**, **InfraOps**, **MLOps**, **AIOps**, **StratOps**, **EcosystemOps**, **ProductOps**, **DesignOps**, **HROps**, **RevOps**, **PayOps**, **CommOps**, **LegalOps**, **ComplianceOps**.  
> **Legacy display:** **BizOps** → folded into **RevOps** (CRO office); machine ID **GTMaaS** unchanged.  
> **Functional products (stable machine IDs):** DaaS, SECaaS — protocols P41/P42, initiatives, `pnpm` script prefixes unchanged.

Product engineering stays in **owner repos**. Specialist **Ops lanes** run in parallel (`blocksIR: false`) on fabric-os, bridge-os, compliance-os, agile-os, and intelligence surfaces.

## Ops lane registry

| Ops lane          | What it owns                                                                    | Execution owner                         | Functional product (ID)    | Protocol    | Operator entry                                                 |
| ----------------- | ------------------------------------------------------------------------------- | --------------------------------------- | -------------------------- | ----------- | -------------------------------------------------------------- |
| **InfraOps**      | Cloud substrate — Terraform, EKS, VPC, IAM, WAF, secrets SM, cost               | fabric-os                               | DaaS (substrate)           | P41         | `pnpm daas:friction:check` · `deploy/terraform/`               |
| **DevOps**        | Deploy choreography — handoffs, smoke, fleet health, env warm/cold              | fabric-os                               | DaaS (delivery)            | P41 · P40   | [devops-as-a-service.md](./devops-as-a-service.md)             |
| **SecOps**        | Stack security — WAF apply, IRSA, pen-test window, CSIRT, vuln cadence          | fabric-os                               | **SECaaS**                 | P42         | [security-as-a-service.md](./security-as-a-service.md)         |
| **MLOps**         | Model lifecycle — training, serving, eval, cost-router ML bridge                | gtcx-intelligence (+ fabric GCP bridge) | _(product program)_        | —           | gtcx-intelligence `09-security/` + fabric `gcp-ml-bridge`      |
| **AIOps**         | AI runtime assurance — anomaly detection, injection red-team, agent tool guard  | fabric-os + intelligence                | _(harness)_                | —           | `anomaly-detector` · eval-pipeline injection suite             |
| **ComplianceOps** | Regulatory evidence, reference-grade lifts, risk/compliance registers           | compliance-os                           | INT-REF                    | —           | compliance-os `pnpm agent:next-work`                           |
| **LegalOps**      | Class S sovereign gates — SOW, DTF, EXT-INF, human signatures                   | agile-os · register canon-os            | Legal program              | —           | `ecosystem:legal-program:check`                                |
| **FleetOps**      | Intake, witness rollup, ZenHub, coordination                                    | bridge-os                               | —                          | P22 harness | `pnpm ecosystem:secas:rollup:write`                            |
| **StratOps**      | Growth, scale, moats, sustainability, fleet north star, enterprise-building     | bridge-os (+ canon institutional)       | **StratAAS**               | GOAL        | [stratops-as-a-service.md](./stratops-as-a-service.md)         |
| **EcosystemOps**  | Partnerships, dev engagement, communities, product-ecosystem network growth     | bridge-os (+ ecosystem-os publish)      | **EcosystemAAS**           | NET         | [ecosystemops-as-a-service.md](./ecosystemops-as-a-service.md) |
| **ProductOps**    | PRD SoR, product-goals, milestone DoD, shippable ≠ roadmap-complete             | bridge-os                               | _(protocol)_               | PDC         | `pnpm ecosystem:product-culture:check`                         |
| **DesignOps**     | UX SoR, EXR packs, journey spine, design system, pm/ux traceability             | bridge-os (+ ledger-ui design SoR)      | **UXaaS**                  | P21         | `pnpm ecosystem:ux-sor:check:fleet`                            |
| **HROps**         | Workforce — persona roster, voice embodiment, squad utilization, hiring backlog | bridge-os (+ agile-os human ceremony)   | **TeamaaS**                | PTM-R6      | `pnpm ecosystem:product-team-honest-done:check`                |
| **RevOps**        | CRO office — pricing, unit economics, revenue analytics, GTM revenue motion     | bridge-os (+ fabric register host)      | **GTMaaS** _(+ economics)_ | P44         | [revops-as-a-service.md](./revops-as-a-service.md)             |
| **PayOps**        | Payment _execution_ — billing rails, Stripe/webhooks, checkout, payouts         | fabric-os substrate + product repos     | **PayOps**                 | —           | [payops-as-a-service.md](./payops-as-a-service.md)             |
| **CommOps**       | Email, SMS, push providers, deliverability _(planned)_                          | fabric-os                               | _(planned)_                | —           | [core.md](./core.md#commops-planned)                           |
| **FinOps**        | Cloud + token + SaaS spend attribution                                          | fabric-os                               | _(extends InfraOps)_       | —           | `baseline cost-stats`                                          |

Machine registry: `bridge-os/pm/spec/ops-programs-registry.json`

**Runtime engine:** [core.md](./core.md) — **CORE** (Centralized Ops Runtime Engine); each Ops lane is a CORE module.

## Four-plane model (Ops naming)

| Plane       | Ops name                      | Owner                             | Product repo                                         |
| ----------- | ----------------------------- | --------------------------------- | ---------------------------------------------------- |
| Engineering | **Product engineering**       | Product repo                      | Features, app security, app threat models            |
| Delivery    | **DevOps** + **InfraOps**     | fabric-os                         | Handoff only — no `kubectl apply` in product PM      |
| Security    | **SecOps**                    | fabric-os                         | Stack security handoff + evidence                    |
| Normative   | Assurance / **ComplianceOps** | canon · protocols · compliance-os | Witness parallel — never blocks IR                   |
| Strategy    | **StratOps**                  | bridge-os · canon-os              | Growth, scale, moats, north star (`blocksIR: false`) |
| Network     | **EcosystemOps**              | bridge-os · ecosystem-os          | Partners, devrel, communities (`blocksIR: false`)    |
| Product     | **ProductOps**                | bridge-os                         | PRD + milestone trace parallel (`blocksIR: false`)   |
| Experience  | **DesignOps**                 | bridge-os · ledger-ui             | UX SoR parallel — not feature UI implementation      |
| Workforce   | **HROps**                     | bridge-os · agile-os              | Persona roster + utilization (`blocksIR: false`)     |
| Revenue     | **RevOps** (CRO)              | bridge-os · fabric-os             | Pricing, economics, GTM revenue — not payment rails  |
| Revenue     | **PayOps** (execution)        | fabric-os substrate + product     | Billing, checkout, payouts, webhooks                 |

## RevOps vs PayOps (strategy vs execution)

|              | **RevOps** — CRO office                                                                                 | **PayOps** — payment execution                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Question** | _How do we make money?_                                                                                 | _How do we collect and pay out?_                                                                     |
| **Owns**     | Pricing, unit economics, revenue analytics, GTM revenue motion, pilot revenue witnesses                 | Stripe/Flutterwave keys, webhooks, metering, billing health, in-product checkout, capital-call rails |
| **Examples** | Tier pricing strategy, `product-goals` economics, GTM friction register, time-to-first-dollar analytics | terminal-os checkout flow, fabric SM for Stripe, markets-os wire settlement, terra-os M-Pesa         |
| **Owner**    | bridge-os (+ fabric register host)                                                                      | fabric-os (substrate) · product repos (domain workflows)                                             |
| **Persona**  | `product-strategist`                                                                                    | `platform-architect` (substrate) · `trade-analyst` / `field-inspector` (domain)                      |

Forensic SoR (PayOps execution inventory): [ecosystem-revops-commops-forensic-2026-06-14.md](../../audit/archive/legacy-docs-audit/ecosystem-revops-commops-forensic-2026-06-14.md)

> **Note:** Forensic filename predates this split — _RevOps_ in that doc meant payment-provider centralization; that work is **PayOps substrate**, not CRO RevOps.

## StratOps vs EcosystemOps vs RevOps

|              | **StratOps**                                | **EcosystemOps**                                              | **RevOps**                           |
| ------------ | ------------------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| **Question** | _Why does the network compound growth?_     | _Who builds on us — partners, devs, communities?_             | _What revenue do partners generate?_ |
| **Owns**     | Growth thesis, moats, scale, sustainability | Partner enablement, DevRel, communities, publish coordination | LOI/DTF, pricing, pilot revenue      |
| **Examples** | `strategicPillars`, programme-lane map      | `ecosystemops-network-registry`, ecosystem-os GitBook         | `gtm-friction-register`              |

## StratOps vs ProductOps vs FleetOps vs RevOps

|                 | **StratOps**                                                  | **ProductOps**                         | **FleetOps**                  | **RevOps**                        |
| --------------- | ------------------------------------------------------------- | -------------------------------------- | ----------------------------- | --------------------------------- |
| **Horizon**     | Years → quarters (growth, scale, moats)                       | Quarters → sprints (repo milestone)    | Now (next story)              | Quarters (tactical CRO economics) |
| **Owns**        | Growth, economies of scale, sustainability, moats, north star | Per-repo PRD, product-goals, shippable | P22, intake, witness rollups  | Pricing, unit econ, GTM revenue   |
| **Examples**    | `ecosystem-fleet-goals-registry`, `fleet-live-programmes`     | `prd-index`, `product-goals.json`      | `pnpm agent:next-work`        | `gtm-friction-register`           |
| **Coordinates** | Product team via programmes + goal orientation                | Implements fleet programme heads       | Executes selected engineering | Revenue motion within strategy    |

## HROps vs FleetOps vs ProductOps

|                    | **HROps**                                         | **FleetOps**                               | **ProductOps**                                 |
| ------------------ | ------------------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| **Owns**           | Who works the repo — personas, voice, utilization | What work runs next — P22, intake, rollups | What we build — PRD, milestones, shippable DoD |
| **Examples**       | `repo-persona-profiles`, GATE-PERSONA-READ        | `pnpm agent:next-work`, ZenHub sync        | `product-goals.json`, prd-index                |
| **Human vs agent** | Both — agile squad charters + agentic roster      | Agent execution engine                     | Product definition culture                     |

## Product repos under new attack surfaces (AI, Mythos, quantum)

| Repo / lane                | Engineering owns                             | SecOps / AIOps owns                | MLOps owns                 |
| -------------------------- | -------------------------------------------- | ---------------------------------- | -------------------------- |
| **markets-os**             | Trading APIs, broker logic, app threat model | WAF, staging secrets, fleet cards  | —                          |
| **terminal-os**            | Client auth, session, AGX/CRX surfaces       | Deploy profile, IRSA card (S4-05)  | —                          |
| **gtcx-os / intelligence** | Mythos, models, gRPC services                | Stack + pen-test on live substrate | Model cards, eval pipeline |
| **sgnx / protocols**       | Protocol verification, crypto surfaces       | PNV staging, verifier deploy       | —                          |

**Quantum / PQC:** SecOps program backlog (post SECAS-S4) — crypto-agility register; not a separate Ops lane yet.

## Continuous operations (SecOps program)

| Loop                | Ops lane | Cadence                     | SECaaS sprint (functional ID) |
| ------------------- | -------- | --------------------------- | ----------------------------- |
| Threat surveillance | SecOps   | Weekly                      | SECAS-S4+ (planned)           |
| Vuln / supply chain | SecOps   | Weekly + CI                 | SECAS-S4-02 / S4-03           |
| External pen-test   | SecOps   | Annual window + remediation | SECAS-S2 / S4-04              |
| IR / drill          | SecOps   | Quarterly                   | SECAS-S4-01                   |
| AI red-team         | AIOps    | Nightly + on model change   | eval-pipeline harness         |
| Model eval          | MLOps    | Per release                 | intelligence CI               |

## Agentic team model (personas per Ops lane)

| Ops lane            | Institutional persona                                                           | Frame                       |
| ------------------- | ------------------------------------------------------------------------------- | --------------------------- |
| SecOps              | `security-engineer`                                                             | regulatory-audit            |
| DevOps / InfraOps   | `platform-architect`                                                            | development                 |
| ComplianceOps       | `compliance-officer`                                                            | regulatory-audit            |
| MLOps / AIOps       | `security-engineer` + product ML owner                                          | development                 |
| LegalOps            | Human + compliance-officer witness                                              | regulatory-audit            |
| FleetOps            | `protocol-engineer`                                                             | development                 |
| StratOps            | `product-strategist` (lead) · `protocol-engineer` (programmes)                  | trading-floor               |
| EcosystemOps        | `product-strategist` · `protocol-engineer` (partner/dev programs)               | trading-floor               |
| ProductOps          | `product-strategist`                                                            | trading-floor               |
| DesignOps           | `product-designer`                                                              | development                 |
| HROps               | `agile-coach` · `protocol-engineer`                                             | development                 |
| RevOps              | `product-strategist`                                                            | trading-floor               |
| PayOps              | `platform-architect` (substrate) · `trade-analyst` · `field-inspector` (domain) | development / trading-floor |
| CommOps             | `platform-architect` + `product-designer`                                       | development                 |
| Product engineering | persona per repo                                                                | development                 |

## Stable IDs (do not rename in machine artifacts)

| Legacy / functional     | Ops display name                                 |
| ----------------------- | ------------------------------------------------ |
| `INIT-GTCX-INFRA-DAAS`  | DevOps + InfraOps                                |
| `INIT-GTCX-INFRA-SECAS` | SecOps                                           |
| `pnpm daas:*`           | DevOps / InfraOps harness                        |
| `pnpm secas:*`          | SecOps harness                                   |
| `DAAS-S*` stories       | DevOps sprint IDs                                |
| `SECAS-S*` stories      | SecOps sprint IDs                                |
| DaaS                    | DevOps functional product                        |
| SECaaS                  | SecOps functional product                        |
| UXaaS                   | DesignOps functional product                     |
| TeamaaS                 | HROps functional product                         |
| GTMaaS                  | RevOps functional product (CRO / GTM revenue)    |
| StratAAS                | StratOps functional product (fleet strategy)     |
| EcosystemAAS            | EcosystemOps functional product (network growth) |
| BizOps                  | _legacy alias → RevOps_                          |
| PayOps domain registry  | `bridge-os/pm/spec/payops-domain-registry.json`  |
| QAAS                    | QA ship-gate _(not DesignOps — independent UAT)_ |

## Cross-repo routing

Spec: `bridge-os/pm/spec/engineering-lane-abstraction-protocol.json`

- Product P22 **Next work item** = engineering only.
- SecOps gates → **Parallel sovereign gates** / **Parallel assurance lane** — fabric-os owner.
- LegalOps → **Parallel sovereign gates** — agile-os / canon.
- StratOps → **Parallel strategy lane** — growth, scale, moats, north star (`blocksIR: false`).
- EcosystemOps → **Parallel network lane** — partnerships, developer engagement, communities (`blocksIR: false`).
- ProductOps → **Parallel product lane** — bridge-os product-culture protocol (`blocksIR: false`).
- DesignOps → **Parallel experience lane** — bridge-os UX SoR + ledger-ui design canon (`blocksIR: false`).
- HROps → **Parallel workforce lane** — bridge-os persona roster + agile-os squad ceremony (`blocksIR: false`).
- RevOps → **Parallel revenue lane** (CRO) — pricing, economics, GTM revenue (`blocksIR: false`).
- PayOps → **Payment execution** — fabric substrate + owner-repo payout workflows (`blocksIR: false` for integration gaps).
- Redirect: `security` → fabric-os · `legal` → agile-os · `strategy` → bridge-os · `ecosystem` → bridge-os · `gtm` → fabric-os · `revenue` → bridge-os · `product` → bridge-os · `ux` → bridge-os · `workforce` → bridge-os · `payments` → fabric-os · `payments-domain` → owner repo · `documentation` → canon-os.
