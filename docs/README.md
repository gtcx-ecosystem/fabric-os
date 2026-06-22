---
title: 'fabric-os — Documentation Index'
status: current
date: 2026-06-22
owner: fabric-os
tier: standard
tags: ['docs', 'ia', 'p48']
review_cycle: quarterly
document_type: index
---

# fabric-os — Documentation Index

**Path contract:** [`config/sor-map.json`](../config/sor-map.json) · machine table: [`INDEX.md`](./INDEX.md) · [`sor.json`](./sor.json)

**Fleet normative:** [IA-PILLAR-MAP.md](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/docs-ia/IA-PILLAR-MAP.md) · [00-docs-root.json](https://github.com/gtcx-ecosystem/canon-os/blob/main/machine/spec/docs-folders/00-docs-root.json)

## Start here

| Surface                    | Path                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Docs IA map                | [`INDEX.md`](./INDEX.md)                                                                                           |
| Agent work selection       | [`operations/agent-spine/agent-work-selection.md`](./operations/agent-spine/agent-work-selection.md)               |
| Execution roadmap (DaaS)   | [`../audit/product-management/execution-roadmap.md`](../audit/product-management/execution-roadmap.md)             |
| Execution roadmap (SECaaS) | [`../audit/product-management/secas-execution-roadmap.md`](../audit/product-management/secas-execution-roadmap.md) |
| Auto-dev state             | [`../audit/product-management/auto-dev-state.md`](../audit/product-management/auto-dev-state.md)                   |
| Audit entry                | [`../audit/AGENT-START.md`](../audit/AGENT-START.md)                                                               |
| Agents (canonical)         | [`../agents/README.md`](../agents/README.md)                                                                       |
| Runbooks                   | [`operations/runbooks/`](./operations/runbooks/)                                                                   |
| Architecture narratives    | [`architecture/narratives/`](./architecture/narratives/)                                                           |
| SECaaS operations          | [`operations/secas/`](./operations/secas/)                                                                         |
| Machine SoR                | [`../operations/`](../operations/) (alias [`../ops/`](../ops/) shim)                                               |

## Layer table

| Layer        | Path            | Role                                          |
| ------------ | --------------- | --------------------------------------------- |
| Foundation   | `foundation/`   | Charter, vision, mission, goals               |
| Business     | `business/`     | Market and domain narrative                   |
| Architecture | `architecture/` | System design, ADRs, integration              |
| Product      | `product/`      | Personas, UX, roadmap features                |
| Operations   | `operations/`   | Human runbooks + agent ops narrative          |
| Reference    | `reference/`    | Templates, glossary — intake until decomposed |
| GitBook      | `gitbook/`      | Published doc-site source                     |

## Repo-root hubs (outside docs/)

| Hub        | Path          | Role                                    |
| ---------- | ------------- | --------------------------------------- |
| Archive    | `archive/`    | Retired artifacts                       |
| Agile      | `agile/`      | Roadmaps, sprints, scrum                |
| Agents     | `agents/`     | Repo agent harness                      |
| Machine    | `machine/`    | PM execution JSON (alias `pm/` shim)    |
| Operations | `operations/` | P29 domain manifests (alias `ops/`)     |
| Platform   | `platform/`   | Workspace packages + agent scripts      |
| Deploy     | `deploy/`     | Terraform, Kubernetes, operator scripts |
| Audit      | `audit/`      | Audit entry + evidence hub              |
| Workstream | `workstream/` | Active workstream coordination          |

## Doc-site

- **Published source:** [`gitbook/docs-site/`](./gitbook/docs-site/README.md)
- **Build pipeline:** [`../platform/tools/docs-site/`](../platform/tools/docs-site/README.md)

## Gates

```bash
pnpm docs:ia:check
pnpm docs:tree:check
```
