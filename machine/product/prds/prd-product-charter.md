---
id: prd-product-charter
title: 'Fabric OS product charter'
status: current
date: 2026-06-18
owner: principal-technical-pm
productGoalsRef: machine/spec/product-goals.json
milestones: [FLEET-SECOPS-COMPLIANCEOPS-CLEARANCE]
features:
  - secops-clearance
  - complianceops-harness
  - supply-chain-gates
  - fleet-observability
  - deploy-choreography
uxRefs:
  personas:
    - platform-engineer
  jtbd:
    - secure-fleet-deploy
    - validate-supply-chain
  exrs:
    - SECAS-S4-02
---

# PRD — Fabric OS

> **SoR:** This document dictates product vision and shippable scope. Roadmap stories MUST trace here via `machine/product/prd-index.json`.

## Vision

Fabric OS is the sovereign deploy substrate for the GTCX fleet: EKS and staging infrastructure, SecOps and ComplianceOps execution, fleet health, and observability. Over 2026-2028 it becomes the dependable control plane for secure fleet promotion, with supply-chain trust and deploy choreography treated as product surfaces rather than hidden platform toil.

## Mission

Provide the fleet with one auditable infrastructure substrate for secure promotion: SecOps clearance, ComplianceOps harnessing, supply-chain integrity, and deploy choreography that integrators can trust without shadow operations.

## Product goals

Measurable customer and market outcomes for `FLEET-SECOPS-COMPLIANCEOPS-CLEARANCE`:

| Goal                                | Outcome                                                                                                  | Measure                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| PG1 Fleet security clearance        | SecOps and ComplianceOps promote fleet infrastructure with clear evidence and no hidden gating ambiguity | SecOps internal Class R sealed and ComplianceOps fleet harness PASS |
| PG2 Supply-chain trust              | Supply-chain gates remain provably green across the deploy substrate                                     | `SECAS-S4-02` supply-chain gates PASS                               |
| PG3 Operational deploy choreography | Integrators rely on one coherent deploy and observability substrate for staged promotion                 | Demo walkthrough evidence and fleet health witnesses remain current |

## Shipping goals (assurance — not product goals)

Engineering bars that prove the deploy substrate is safe to ship.

| ID                                     | Metric                                | Target                     | Evidence                                                              |
| -------------------------------------- | ------------------------------------- | -------------------------- | --------------------------------------------------------------------- |
| SG1 SecOps and ComplianceOps clearance | Internal clearance + fleet harness    | PASS                       | `audit/evidence/fleet-secops-complianceops-clearance-2026-06-15.json` |
| SG2 Supply-chain gates                 | `SECAS-S4-02`                         | PASS                       | `audit/evidence/secas-supply-chain-check-latest.json`                 |
| SG3 PRD traceability                   | Story -> PRD / capability / milestone | 100% in-flight work traced | `machine/product/prd-index.json`                                      |

## Target customers

| Segment                                    | ICP               | Buyer           | Job to be done                                                                     |
| ------------------------------------------ | ----------------- | --------------- | ---------------------------------------------------------------------------------- |
| Fleet platform teams                       | platform-engineer | platform lead   | promote infrastructure safely with observable SecOps and ComplianceOps gates       |
| Integrator programmes                      | platform-engineer | programme owner | rely on a stable fleet substrate for staging and promotion                         |
| Internal security and compliance operators | platform-engineer | security lead   | validate deploy trust, evidence, and supply-chain integrity without ad-hoc scripts |

## Competition

| Alternative                         | Weakness                                                     | Our differentiation                                       |
| ----------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Generic SaaS without protocol trace | weak sovereign posture and no fleet-specific clearance model | SecOps + ComplianceOps clearance with protocol trace      |
| Ad-hoc infra operations             | hidden gating and inconsistent evidence                      | auditable deploy choreography and fleet harnesses         |
| One-off security scripts            | brittle and ungoverned                                       | supply-chain witness and structured operational substrate |

## Value proposition

**For** operators and integrators consuming Fabric OS **who** need shippable infrastructure outcomes traced to PRD and active milestone, **our product** is Fabric OS **that** delivers service-fabric execution across DevOps, InfraOps, SecOps, fleet environment management, and deploy choreography. **Unlike** ad-hoc docs and sprint theater without product-goals trace, **we** make fleet security clearance and supply-chain trust first-class product surfaces.

## GTM motion

| Motion           | Tier          | Channel                           | Proof required                                                  |
| ---------------- | ------------- | --------------------------------- | --------------------------------------------------------------- |
| Integrator pilot | GR-T2-partial | direct fleet integration          | demo walkthrough evidence + supply-chain gates PASS             |
| Enterprise       | GR-T2-partial | internal platform enablement      | SecOps clearance and ComplianceOps fleet harness PASS           |
| Sovereign        | GR-T2-partial | governed infrastructure promotion | auditable deploy choreography and fleet observability witnesses |

## Features

Scope for this PRD — map to capability matrix IDs and roadmap items:

1. **SecOps clearance** — internal Class R clearance and promotion evidence.
2. **ComplianceOps harness** — fleet compliance execution and witness routing.
3. **Supply-chain gates** — verified integrity checks for the deploy substrate.
4. **Fleet observability** — health and evidence surfaces for infrastructure state.
5. **Deploy choreography** — controlled multi-environment promotion paths.

## Success metrics

- Primary: `SECAS-S4-02` supply-chain gates PASS.
- Secondary: SecOps internal clearance sealed and ComplianceOps fleet harness PASS.
- Guardrails: no hidden vendor gates in product milestone closure; no story done without PRD trace.

## Non-goals

Explicit exclusions (prevents scope creep):

- Product-feature ownership that belongs in consumer product repos.
- Shadow infra procedures without evidence or protocol trace.
- Treating raw composite score alone as the product milestone.

## Milestones

| Milestone                            | Shippable outcome                                                                      | PRD status |
| ------------------------------------ | -------------------------------------------------------------------------------------- | ---------- |
| FLEET-SECOPS-COMPLIANCEOPS-CLEARANCE | SecOps internal Class R sealed; ComplianceOps harness PASS; vendor gates parallel only | current    |

## Links

- Product goals: `machine/spec/product-goals.json`
- Capability matrix: `docs/strategy/product-capability-matrix-*.md`
- Execution roadmap: `docs/strategy/execution-roadmap.md`
- PRD index: `machine/product/prd-index.json`
