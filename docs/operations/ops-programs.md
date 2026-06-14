---
title: GTCX Ops programs — DevOps, SecOps, InfraOps, MLOps, AIOps, ProductOps, DesignOps, HROps, BizOps
status: current
date: 2026-06-14
owner: fabric-os
---

# GTCX Ops programs

> **Operator vocabulary:** **DevOps**, **SecOps**, **InfraOps**, **MLOps**, **AIOps**, **ProductOps**, **DesignOps**, **HROps**, **BizOps**, **RevOps**, **PayOps**, **CommOps**, **LegalOps**, **ComplianceOps**.  
> **Functional products (stable machine IDs):** DaaS, SECaaS — protocols P41/P42, initiatives, `pnpm` script prefixes unchanged.

Product engineering stays in **owner repos**. Specialist **Ops lanes** run in parallel (`blocksIR: false`) on fabric-os, bridge-os, compliance-os, agile-os, and intelligence surfaces.

## Ops lane registry

| Ops lane          | What it owns                                                                    | Execution owner                         | Functional product (ID) | Protocol    | Operator entry                                            |
| ----------------- | ------------------------------------------------------------------------------- | --------------------------------------- | ----------------------- | ----------- | --------------------------------------------------------- |
| **InfraOps**      | Cloud substrate — Terraform, EKS, VPC, IAM, WAF, secrets SM, cost               | fabric-os                               | DaaS (substrate)        | P41         | `pnpm daas:friction:check` · `deploy/terraform/`          |
| **DevOps**        | Deploy choreography — handoffs, smoke, fleet health, env warm/cold              | fabric-os                               | DaaS (delivery)         | P41 · P40   | [devops-as-a-service.md](./devops-as-a-service.md)        |
| **SecOps**        | Stack security — WAF apply, IRSA, pen-test window, CSIRT, vuln cadence          | fabric-os                               | **SECaaS**              | P42         | [security-as-a-service.md](./security-as-a-service.md)    |
| **MLOps**         | Model lifecycle — training, serving, eval, cost-router ML bridge                | gtcx-intelligence (+ fabric GCP bridge) | _(product program)_     | —           | gtcx-intelligence `09-security/` + fabric `gcp-ml-bridge` |
| **AIOps**         | AI runtime assurance — anomaly detection, injection red-team, agent tool guard  | fabric-os + intelligence                | _(harness)_             | —           | `anomaly-detector` · eval-pipeline injection suite        |
| **ComplianceOps** | Regulatory evidence, reference-grade lifts, risk/compliance registers           | compliance-os                           | INT-REF                 | —           | compliance-os `pnpm agent:next-work`                      |
| **LegalOps**      | Class S sovereign gates — SOW, DTF, EXT-INF, human signatures                   | agile-os · register canon-os            | Legal program           | —           | `ecosystem:legal-program:check`                           |
| **FleetOps**      | Intake, witness rollup, ZenHub, coordination                                    | bridge-os                               | —                       | P22 harness | `pnpm ecosystem:secas:rollup:write`                       |
| **ProductOps**    | PRD SoR, product-goals, milestone DoD, shippable ≠ roadmap-complete             | bridge-os                               | _(protocol)_            | PDC         | `pnpm ecosystem:product-culture:check`                    |
| **DesignOps**     | UX SoR, EXR packs, journey spine, design system, pm/ux traceability             | bridge-os (+ ledger-ui design SoR)      | **UXaaS**               | P21         | `pnpm ecosystem:ux-sor:check:fleet`                       |
| **HROps**         | Workforce — persona roster, voice embodiment, squad utilization, hiring backlog | bridge-os (+ agile-os human ceremony)   | **TeamaaS**             | PTM-R6      | `pnpm ecosystem:product-team-honest-done:check`           |
| **BizOps**        | GTM execution, pilot DoD, LOI/DTF, partner motion, business metrics witnesses   | fabric-os (+ bridge program office)     | **GTMaaS**              | P44         | [gtm-as-a-service.md](./gtm-as-a-service.md)              |
| **RevOps**        | Billing provider substrate — Stripe, webhooks, metering _(planned)_             | fabric-os                               | _(planned)_             | —           | [core.md](./core.md#revops-planned)                       |
| **PayOps**        | Domain payment orchestration — capital calls, escrow, M-Pesa, gov fees          | **product owner repos** (see registry)  | _(distributed)_         | —           | `bridge-os/pm/spec/payops-domain-registry.json`           |
| **CommOps**       | Email, SMS, push providers, deliverability _(planned)_                          | fabric-os                               | _(planned)_             | —           | [core.md](./core.md#commops-planned)                      |
| **FinOps**        | Cloud + token + SaaS spend attribution                                          | fabric-os                               | _(extends InfraOps)_    | —           | `baseline cost-stats`                                     |

Machine registry: `bridge-os/pm/spec/ops-programs-registry.json`

**Runtime engine:** [core.md](./core.md) — **CORE** (Centralized Ops Runtime Engine); each Ops lane is a CORE module.

## Four-plane model (Ops naming)

| Plane       | Ops name                      | Owner                             | Product repo                                       |
| ----------- | ----------------------------- | --------------------------------- | -------------------------------------------------- |
| Engineering | **Product engineering**       | Product repo                      | Features, app security, app threat models          |
| Delivery    | **DevOps** + **InfraOps**     | fabric-os                         | Handoff only — no `kubectl apply` in product PM    |
| Security    | **SecOps**                    | fabric-os                         | Stack security handoff + evidence                  |
| Normative   | Assurance / **ComplianceOps** | canon · protocols · compliance-os | Witness parallel — never blocks IR                 |
| Product     | **ProductOps**                | bridge-os                         | PRD + milestone trace parallel (`blocksIR: false`) |
| Experience  | **DesignOps**                 | bridge-os · ledger-ui             | UX SoR parallel — not feature UI implementation    |
| Workforce   | **HROps**                     | bridge-os · agile-os              | Persona roster + utilization (`blocksIR: false`)   |
| Business    | **BizOps**                    | fabric-os · bridge-os             | GTM / pilot friction parallel (`blocksIR: false`)  |
| Payments    | **RevOps** (substrate)        | fabric-os                         | Shared Stripe/webhook/metering — not domain logic  |
| Payments    | **PayOps** (domain)           | markets-os · terra-os · product   | Capital calls, escrow, M-Pesa — never centralize   |

## RevOps vs PayOps (do not merge)

|                | **RevOps** (fabric)                               | **PayOps** (product repo)                                  |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| **Owns**       | Provider keys, webhook ingress, metering witness  | Payment business logic, authority models, reconciliation   |
| **Examples**   | terminal-os Stripe SM, compliance-os usage rollup | markets-os capital calls, terra-os concession fees         |
| **Owner**      | fabric-os                                         | markets-os, terra-os, terminal-os (checkout UX)            |
| **Regulatory** | PCI SAQ A substrate boundary                      | Trade authority URLs, gov fee schedules, wire instructions |

Forensic SoR: [ecosystem-revops-commops-forensic-2026-06-14.md](../../audit/ecosystem-revops-commops-forensic-2026-06-14.md)

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

| Ops lane            | Institutional persona                            | Frame                            |
| ------------------- | ------------------------------------------------ | -------------------------------- |
| SecOps              | `security-engineer`                              | regulatory-audit                 |
| DevOps / InfraOps   | `platform-architect`                             | development                      |
| ComplianceOps       | `compliance-officer`                             | regulatory-audit                 |
| MLOps / AIOps       | `security-engineer` + product ML owner           | development                      |
| LegalOps            | Human + compliance-officer witness               | regulatory-audit                 |
| ProductOps          | `product-strategist`                             | trading-floor                    |
| DesignOps           | `product-designer`                               | development                      |
| HROps               | `agile-coach` · `protocol-engineer`              | development                      |
| BizOps              | `product-strategist`                             | trading-floor                    |
| RevOps              | `product-strategist` + `platform-architect`      | development                      |
| PayOps              | `trade-analyst` · `field-inspector` (per domain) | trading-floor / field-operations |
| CommOps             | `platform-architect` + `product-designer`        | development                      |
| Product engineering | persona per repo                                 | development                      |

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
| GTMaaS                  | BizOps functional product                        |
| PayOps domain registry  | `bridge-os/pm/spec/payops-domain-registry.json`  |
| QAAS                    | QA ship-gate _(not DesignOps — independent UAT)_ |

## Cross-repo routing

Spec: `bridge-os/pm/spec/engineering-lane-abstraction-protocol.json`

- Product P22 **Next work item** = engineering only.
- SecOps gates → **Parallel sovereign gates** / **Parallel assurance lane** — fabric-os owner.
- LegalOps → **Parallel sovereign gates** — agile-os / canon.
- BizOps → **Parallel business lane** — fabric-os register + bridge program office (`blocksIR: false`).
- ProductOps → **Parallel product lane** — bridge-os product-culture protocol (`blocksIR: false`).
- DesignOps → **Parallel experience lane** — bridge-os UX SoR + ledger-ui design canon (`blocksIR: false`).
- HROps → **Parallel workforce lane** — bridge-os persona roster + agile-os squad ceremony (`blocksIR: false`).
- PayOps → **Domain payment lane** — owner-repo orchestration; consumes RevOps substrate where applicable (`blocksIR: false` for integration gaps).
- Redirect: `security` → fabric-os · `legal` → agile-os · `gtm` → fabric-os · `product` → bridge-os · `ux` → bridge-os · `workforce` → bridge-os · `payments-domain` → owner repo · `revops` → fabric-os · `documentation` → canon-os.
