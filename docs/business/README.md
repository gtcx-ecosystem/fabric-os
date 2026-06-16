---
title: 'business/ — market, customers, economics'
status: current
date: 2026-06-16
owner: fabric-os
document_type: folder-spec
tier: critical
tags: ['documentation', 'business']
review_cycle: on-change
goals: 'Business narrative SoR — decomposed from reference/product and overview/product'
---

# `docs/business/` — fabric-os

> **Cross-reference spec:** [`../../canon-os/pm/spec/docs-layer-cross-reference.json`](../../canon-os/pm/spec/docs-layer-cross-reference.json)  
> **Foundation (read first):** [`../foundation/`](../foundation/) — vision/mission summaries only; detail lives here.

## Layer map

| Layer        | Path               | Role                                                           |
| ------------ | ------------------ | -------------------------------------------------------------- |
| Foundation   | `docs/foundation/` | Agent mandatory — charter, vision, mission, goals              |
| **Business** | `docs/business/`   | Market, customers, economics, strategy depth                   |
| Product UX   | `docs/product/ux/` | Personas, JTBD, workflows (from reference/product/ux-research) |
| Reference    | `docs/reference/`  | Templates + glossary only (post-decomposition)                 |

## Cross-reference table

| Topic         | Foundation                             | Business canonical                                               | Former reference   | Former overview        |
| ------------- | -------------------------------------- | ---------------------------------------------------------------- | ------------------ | ---------------------- |
| Vision detail | [vision.md](../foundation/vision.md)   | [strategy/executive-summary.md](./strategy/executive-summary.md) | reference/product/ | overview/product/      |
| Customers     | [mission.md](../foundation/mission.md) | [customers/](./customers/)                                       | reference/product/ | overview/product/      |
| Markets       | —                                      | [market/](./market/)                                             | reference/product/ | overview/product/      |
| Economics     | [goals.md](../foundation/goals.md)     | [economics/](./economics/)                                       | reference/product/ | overview/product/      |
| Research      | —                                      | [research/](./research/)                                         | —                  | archive/docs/business/ |

## Subfolders

| Folder          | Contents                                                                            |
| --------------- | ----------------------------------------------------------------------------------- |
| `market/`       | primary/secondary/tertiary market, problem, stakeholder analysis                    |
| `customers/`    | ICP, personas, core audiences                                                       |
| `economics/`    | business model, pricing, revenue, metrics                                           |
| `strategy/`     | executive summary, ecosystem integration                                            |
| `research/`     | industry transformation, funding, capital markets, ecosystem overview, master voice |
| `case-studies/` | sector case studies                                                                 |
| `use-cases/`    | stakeholder use cases                                                               |

## Agent rules

1. Read `docs/foundation/` before P22; use `docs/business/` for market/customer depth.
2. Do not recreate business narrative under `docs/reference/product/` — pointers only.
3. Log structural changes in `docs/CHANGELOG.md`.
