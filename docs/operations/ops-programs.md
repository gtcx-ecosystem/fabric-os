---
title: GTCX Ops programs — DevOps, SecOps, InfraOps, MLOps, AIOps
status: current
date: 2026-06-14
owner: fabric-os
---

# GTCX Ops programs

> **Operator vocabulary:** **DevOps**, **SecOps**, **InfraOps**, **MLOps**, **AIOps**, **LegalOps**, **ComplianceOps**.  
> **Functional products (stable machine IDs):** DaaS, SECaaS — protocols P41/P42, initiatives, `pnpm` script prefixes unchanged.

Product engineering stays in **owner repos**. Specialist **Ops lanes** run in parallel (`blocksIR: false`) on fabric-os, bridge-os, compliance-os, agile-os, and intelligence surfaces.

## Ops lane registry

| Ops lane          | What it owns                                                                   | Execution owner                         | Functional product (ID) | Protocol    | Operator entry                                            |
| ----------------- | ------------------------------------------------------------------------------ | --------------------------------------- | ----------------------- | ----------- | --------------------------------------------------------- |
| **InfraOps**      | Cloud substrate — Terraform, EKS, VPC, IAM, WAF, secrets SM, cost              | fabric-os                               | DaaS (substrate)        | P41         | `pnpm daas:friction:check` · `deploy/terraform/`          |
| **DevOps**        | Deploy choreography — handoffs, smoke, fleet health, env warm/cold             | fabric-os                               | DaaS (delivery)         | P41 · P40   | [devops-as-a-service.md](./devops-as-a-service.md)        |
| **SecOps**        | Stack security — WAF apply, IRSA, pen-test window, CSIRT, vuln cadence         | fabric-os                               | **SECaaS**              | P42         | [security-as-a-service.md](./security-as-a-service.md)    |
| **MLOps**         | Model lifecycle — training, serving, eval, cost-router ML bridge               | gtcx-intelligence (+ fabric GCP bridge) | _(product program)_     | —           | gtcx-intelligence `09-security/` + fabric `gcp-ml-bridge` |
| **AIOps**         | AI runtime assurance — anomaly detection, injection red-team, agent tool guard | fabric-os + intelligence                | _(harness)_             | —           | `anomaly-detector` · eval-pipeline injection suite        |
| **ComplianceOps** | Regulatory evidence, reference-grade lifts, risk/compliance registers          | compliance-os                           | INT-REF                 | —           | compliance-os `pnpm agent:next-work`                      |
| **LegalOps**      | Class S sovereign gates — SOW, DTF, EXT-INF, human signatures                  | agile-os · register canon-os            | Legal program           | —           | `ecosystem:legal-program:check`                           |
| **FleetOps**      | Intake, witness rollup, ZenHub, coordination                                   | bridge-os                               | —                       | P22 harness | `pnpm ecosystem:secas:rollup:write`                       |

Machine registry: `bridge-os/pm/spec/ops-programs-registry.json`

**Runtime engines:** [ops-runtime-engines.md](./ops-runtime-engines.md) — each Ops lane as sense→reason→act→learn intelligence with trust fortress and innovation moat.

## Four-plane model (Ops naming)

| Plane       | Ops name                      | Owner                             | Product repo                                    |
| ----------- | ----------------------------- | --------------------------------- | ----------------------------------------------- |
| Engineering | **Product engineering**       | Product repo                      | Features, app security, app threat models       |
| Delivery    | **DevOps** + **InfraOps**     | fabric-os                         | Handoff only — no `kubectl apply` in product PM |
| Security    | **SecOps**                    | fabric-os                         | Stack security handoff + evidence               |
| Normative   | Assurance / **ComplianceOps** | canon · protocols · compliance-os | Witness parallel — never blocks IR              |

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

| Ops lane            | Institutional persona                  | Frame            |
| ------------------- | -------------------------------------- | ---------------- |
| SecOps              | `security-engineer`                    | regulatory-audit |
| DevOps / InfraOps   | `platform-architect`                   | development      |
| ComplianceOps       | `compliance-officer`                   | regulatory-audit |
| MLOps / AIOps       | `security-engineer` + product ML owner | development      |
| LegalOps            | Human + compliance-officer witness     | regulatory-audit |
| Product engineering | persona per repo                       | development      |

## Stable IDs (do not rename in machine artifacts)

| Legacy / functional     | Ops display name          |
| ----------------------- | ------------------------- |
| `INIT-GTCX-INFRA-DAAS`  | DevOps + InfraOps         |
| `INIT-GTCX-INFRA-SECAS` | SecOps                    |
| `pnpm daas:*`           | DevOps / InfraOps harness |
| `pnpm secas:*`          | SecOps harness            |
| `DAAS-S*` stories       | DevOps sprint IDs         |
| `SECAS-S*` stories      | SecOps sprint IDs         |
| DaaS                    | DevOps functional product |
| SECaaS                  | SecOps functional product |

## Cross-repo routing

Spec: `bridge-os/pm/spec/engineering-lane-abstraction-protocol.json`

- Product P22 **Next work item** = engineering only.
- SecOps gates → **Parallel sovereign gates** / **Parallel assurance lane** — fabric-os owner.
- LegalOps → **Parallel sovereign gates** — agile-os / canon.
- Redirect: `security` → fabric-os · `legal` → agile-os · `documentation` → canon-os.
