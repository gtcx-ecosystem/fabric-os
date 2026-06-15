---
title: 'DevOps & InfraOps (DaaS functional product)'
status: current
date: 2026-06-14
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
protocol: P41-DEVOPS-AS-A-SERVICE
initiative: INIT-GTCX-INFRA-DAAS
opsLanes: [DevOps, InfraOps]
---

# DevOps & InfraOps — fabric-os primary delivery program

> **Ops vocabulary:** **DevOps** (deploy choreography, fleet health) + **InfraOps** (Terraform, EKS, cloud substrate).  
> **Functional product ID:** **DaaS** — stable in protocols, `pnpm daas:*`, and `DAAS-S*` stories.  
> **Registry:** [ops-programs.md](../core-ops/batch-a/ops-programs.md) · `bridge-os/pm/spec/ops-programs-registry.json`

**Normative:** `canon-os/.../41-devops-as-a-service/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/devops-as-a-service.json`  
**Friction SoR:** `pm/friction-register.json`  
**Roadmap SoR:** `pm/daas-roadmap.json`  
**Deploy choreography:** P40 (`bridge-os/pm/spec/deployment-choreography.json`)

## Obligation

**DevOps** and **InfraOps** are **separate concerns** from product engineering — parallel to **SecOps**, **ComplianceOps**, and **LegalOps**. Product PM does **not** lead infra execution. **fabric-os** owns deployability per repo and actively unblocks the fleet.

## Four-plane model (Ops naming)

| Plane           | Ops lane                 | Owner                 | Product engineering                                  |
| --------------- | ------------------------ | --------------------- | ---------------------------------------------------- |
| **Engineering** | Product engineering      | Product repo          | Features, tests, `deployment:smoke`                  |
| **Delivery**    | **DevOps**               | fabric-os             | Handoff only — never `kubectl apply` in product repo |
| **Substrate**   | **InfraOps**             | fabric-os             | Terraform, EKS, IAM, WAF substrate                   |
| **Assurance**   | ComplianceOps / LegalOps | canon · compliance-os | Witness parallel (`blocksIR: false`)                 |

## Product interface

1. Maintain `docs/operations/deployment-profile.json`
2. On upstream failure → `to-fabric-os-{topic}-YYYY-MM-DD.md` (P24)
3. Re-run smoke/capture when `from-fabric-os-*` status **delivered**

## Infra interface

1. Triage inbound into `pm/friction-register.json`
2. Execute on `pm/daas-roadmap.json` sprints (DAAS-S\*)
3. Seal with `from-fabric-os-*` + `audit/evidence/*-latest.json`
4. Run `pnpm daas:friction:check` + `pnpm daas:fleet:health` each session

## Operator entry

```bash
pnpm agent:next-work          # P22 — infra primary roadmap
pnpm daas:friction:check      # open friction items
pnpm env:status               # staging warm/cold (via bridge-os when cwd sibling)
node platform/tools/scripts/cross-repo-health-probe.mjs
```

Verification path: agents execute probes in-session (P27); report command + exit code.
