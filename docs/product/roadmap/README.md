---
title: 'product/roadmap — executable plan SoR'
status: current
date: 2026-06-22
owner: fabric-os
document_type: product
tier: critical
tags: ['documentation', 'product', 'roadmap']
review_cycle: on-change
---

# `docs/product/roadmap/` — executable plan

> **Reference:** [baseline-os/agile/README.md](https://github.com/gtcx-ecosystem/baseline-os/blob/main/agile/README.md) (4-plane pipeline)  
> **Compile:** `pnpm product:compile` → `machine/backlog.json` + `machine/roadmap/initiatives.json` (P22 queue — never hand-edit)  
> **Ceremony:** [`../../../agile/roadmaps/README.md`](../../../agile/roadmaps/README.md) (lane narratives only)

## Index

| Artifact             | Path                                                 |
| -------------------- | ---------------------------------------------------- |
| Capability matrix    | [capability-matrix.md](./capability-matrix.md)       |
| Implementation truth | [implementation-truth.md](./implementation-truth.md) |
| Initiatives          | [initiatives/](./initiatives/README.md) (`INIT-*`)   |
| Features             | [features/](./features/README.md) (`FEAT-*`)         |
| Stories              | [stories/](./stories/README.md) (`STORY-*`)          |

## Separation

| Concern                         | SoR                                                       |
| ------------------------------- | --------------------------------------------------------- |
| Executable plan (this folder)   | `docs/product/roadmap/`                                   |
| Lane narratives (GTM, legal, …) | `agile/roadmaps/`                                         |
| Machine backlog (compiled)      | `machine/backlog.json`                                    |
| P29 sync slice                  | `operations/machine/backlog.json` via `pnpm machine:sync` |
