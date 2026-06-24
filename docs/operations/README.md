---
title: 'Operations — fabric-os'
status: current
date: 2026-06-24
owner: fabric-os
document_type: overview
tier: critical
tags: ['documentation', 'operations']
review_cycle: on-change
---

# `docs/operations/` — fabric-os

> **Central spec:** [`canon-os/pm/spec/docs-folders/05-operations.json`](../../canon-os/pm/spec/docs-folders/05-operations.json)  
> **Pack:** [`../../machine/spec/docs-operations-pack.json`](../../machine/spec/docs-operations-pack.json)  
> **Subfolder contract:** [`../../canon-os/pm/spec/docs-operations-subfolder-contract.json`](../../canon-os/pm/spec/docs-operations-subfolder-contract.json)  
> **Foundation:** [`../foundation/`](../foundation/) · **Machine SoR:** [`../../operations/`](../../operations/) · **Agents:** [`../../agents/`](../../agents/)

fabric-os is the fleet **ops-as-a-service provider** (DaaS, SECaaS, complianceops). Human runbooks and agent ops narrative live here; P29 manifests stay under **`operations/`** — link only.

| Zone                                                | Role                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| [runbooks/](./runbooks/README.md)                   | Operator runbooks — \*-as-a-service narratives |
| [deployment/](./deployment/README.md)               | Release and environment narratives             |
| [agent-init/](./agent-init/README.md)               | Session start, P22/P27, git workflow           |
| [compliance/](./compliance/README.md)               | Platform-runtime compliance instance artifacts |
| [coordination/](./coordination/README.md)           | Cross-repo handoffs                            |
| [core-ops/](./core-ops/README.md)                   | Fleet core ops programmes (provider zone)      |
| [platform-services/](./platform-services/README.md) | DaaS / SECaaS provider catalog                 |
| [secas/](./secas/README.md)                         | Supply-chain assurance programmes              |
| [scorecard.md](./scorecard.md)                      | MPR rollup (read-only)                         |

**Gate:** `pnpm docs:operations:check`

## Cross-reference

| Layer                  | Path               | Role                               |
| ---------------------- | ------------------ | ---------------------------------- |
| Foundation             | `docs/foundation/` | Charter, vision, goals             |
| **Operations (prose)** | `docs/operations/` | Runbooks + agent init              |
| **Machine ops (P29)**  | `operations/`      | Manifests, gates, evidence JSON    |
| Agents                 | `agents/`          | Bootstrap, capabilities, playbooks |
