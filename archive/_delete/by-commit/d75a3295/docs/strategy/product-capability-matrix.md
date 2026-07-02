---
title: 'Fabric OS — Product capability matrix'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['protocol', 'documentation']
review_cycle: on-change
document_type: protocol
---

# Fabric OS — Product capability matrix

> Maps fabric-os functional capabilities → PRDs → EXRs → JTBDs → programs.
> Fleet product taxonomy SoR: `agile-os` tactical CPO; local PRD SoR: `pm/product/prd-index.json`.

## Capability map

| Capability ID    | Capability                | Program     | PRD                                                                                | EXR                                                                        | JTBD                                                                            | Personas                              | Status    |
| ---------------- | ------------------------- | ----------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------- | --------- |
| `FABRIC-CAP-001` | Staging substrate handoff | DaaS        | [PRD-daass-operator-substrate](../pm/product/prds/PRD-daass-operator-substrate.md) | [EXR-001](../docs/specs/experiences/EXR-001-staging-handoff-to-witness.md) | [JTBD-staging-substrate-ready](../pm/ux/jtbd/jtbd-staging-substrate-ready.json) | sibling-integrator, platform-operator | operating |
| `FABRIC-CAP-002` | Fleet health witness      | DaaS        | [PRD-daass-operator-substrate](../pm/product/prds/PRD-daass-operator-substrate.md) | [EXR-002](../docs/specs/experiences/EXR-002-fleet-health-probe.md)         | [JTBD-fleet-health-witness](../pm/ux/jtbd/jtbd-fleet-health-witness.json)       | platform-operator                     | operating |
| `FABRIC-CAP-003` | Stack security evidence   | SECaaS      | [PRD-secas-stack-security](../pm/product/prds/PRD-secas-stack-security.md)         | [EXR-003](../docs/specs/experiences/EXR-003-secas-evidence-delivery.md)    | [JTBD-security-evidence-path](../pm/ux/jtbd/jtbd-security-evidence-path.json)   | security-operator, compliance-buyer   | operating |
| `FABRIC-CAP-004` | Fleet hygiene runner      | HaaS        | [PRD-daass-operator-substrate](../pm/product/prds/PRD-daass-operator-substrate.md) | —                                                                          | —                                                                               | platform-operator                     | operating |
| `FABRIC-CAP-005` | Five-core audit delegate  | AaaS        | [PRD-secas-stack-security](../pm/product/prds/PRD-secas-stack-security.md)         | —                                                                          | —                                                                               | security-operator, compliance-buyer   | operating |
| `FABRIC-CAP-006` | Trade-lane deploy matrix  | DaaS/SECaaS | [PRD-daass-operator-substrate](../pm/product/prds/PRD-daass-operator-substrate.md) | —                                                                          | —                                                                               | platform-operator, sibling-integrator | done      |
| `FABRIC-CAP-007` | MLOps substrate bridge    | AI/ML ops   | [prd-product-charter](../pm/product/prds/prd-product-charter.md)                   | TBD                                                                        | —                                                                               | platform-operator                     | planned   |

## Capability → feature coverage

| Capability       | Feature                             | Coverage status | Evidence command                                                                                 |
| ---------------- | ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `FABRIC-CAP-001` | Per-repo DaaS cards                 | covered         | `pnpm daas:cards:check:write`                                                                    |
| `FABRIC-CAP-001` | Staging scripts / terraform targets | covered         | `platform/scripts/staging/*.sh`                                                                  |
| `FABRIC-CAP-001` | Outbound coordination seals         | covered         | `docs/operations/coordination/from-fabric-os-*`                                                  |
| `FABRIC-CAP-002` | Cross-repo health probe             | covered         | `pnpm daas:fleet:health`                                                                         |
| `FABRIC-CAP-002` | Friction register sync              | covered         | `pnpm daas:friction:check:write`                                                                 |
| `FABRIC-CAP-003` | Sovereign approval register         | covered         | `pnpm secas:approval:check:write`                                                                |
| `FABRIC-CAP-003` | Security friction register          | covered         | `pnpm secas:friction:check:write`                                                                |
| `FABRIC-CAP-003` | Pen-test ingest + remediation       | in progress     | `pnpm secas:pentest:remediation:check:write` (awaiting BG-10-10-REPORT)                          |
| `FABRIC-CAP-003` | Supply-chain CVE policy             | covered         | `pnpm secas:supply-chain:check:write`                                                            |
| `FABRIC-CAP-003` | Vulnerability cadence               | covered         | `pnpm secas:vuln-cadence:check:write`                                                            |
| `FABRIC-CAP-003` | CSIRT operating model               | covered         | `pnpm secas:csirt:check:write`                                                                   |
| `FABRIC-CAP-004` | Fleet hygiene runner                | covered         | `pnpm --dir ../bridge-os ecosystem:hygiene:check`                                                |
| `FABRIC-CAP-005` | Five-core audit witness delegate    | covered         | `pnpm fabric:assurance:run:write`                                                                |
| `FABRIC-CAP-006` | Lane-aware deploy matrix            | done            | `pnpm fabric:lanes:check:write`                                                                  |
| `FABRIC-CAP-007` | MLOps cost-router prod ingress      | planned         | `docs/operations/coordination/inbound/to-gtcx-os-intelligence-cost-router-staging-2026-06-15.md` |

## PRD → EXR trace

| PRD                                                                                | Linked EXRs      | Linked JTBDs                                            | Linked personas                       |
| ---------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------- | ------------------------------------- |
| [PRD-daass-operator-substrate](../pm/product/prds/PRD-daass-operator-substrate.md) | EXR-001, EXR-002 | JTBD-staging-substrate-ready, JTBD-fleet-health-witness | platform-operator, sibling-integrator |
| [PRD-secas-stack-security](../pm/product/prds/PRD-secas-stack-security.md)         | EXR-003          | JTBD-security-evidence-path                             | security-operator, compliance-buyer   |
| [prd-product-charter](../pm/product/prds/prd-product-charter.md)                   | TBD              | —                                                       | platform-operator (baseline)          |

## Program ownership

| Program               | Initiative               | Roadmap                                             | Owner                 | Status                                           |
| --------------------- | ------------------------ | --------------------------------------------------- | --------------------- | ------------------------------------------------ |
| DevOps-as-a-Service   | INIT-GTCX-INFRA-DAAS     | [`pm/daas-roadmap.json`](../pm/daas-roadmap.json)   | fabric-os             | complete                                         |
| Security-as-a-Service | INIT-GTCX-INFRA-SECAS    | [`pm/secas-roadmap.json`](../pm/secas-roadmap.json) | fabric-os             | complete (S4-04 execution pending vendor report) |
| Hygiene-as-a-Service  | INIT-GTCX-SERVICE-FABRIC | [`pm/haas-roadmap.json`](../pm/haas-roadmap.json)   | fabric-os             | complete                                         |
| Audit-as-a-Service    | INIT-GTCX-SERVICE-FABRIC | [`pm/aaas-roadmap.json`](../pm/aaas-roadmap.json)   | fabric-os             | complete                                         |
| AI/ML ops lane        | TBD                      | feature/ai-mlops branch                             | fabric-os + bridge-os | planned                                          |
