---
title: 'agile/ — delivery ceremony (fabric-os)'
status: current
date: 2026-06-22
owner: fabric-os
document_type: overview
tier: operating
tags: ['documentation', 'agile']
review_cycle: on-change
---

# `agile/` — fabric-os delivery system

> **Pack:** [`../../canon-os/machine/spec/agile-pack.json`](../../canon-os/machine/spec/agile-pack.json)  
> **L1 spec:** [canon-os L1-agile.json](https://github.com/gtcx-ecosystem/canon-os/blob/main/machine/spec/repo-provisioning/L1-agile.json)  
> **Reference fixture:** [baseline-os/agile/README.md](https://github.com/gtcx-ecosystem/baseline-os/blob/main/agile/README.md)

## The pipeline (4 planes)

```
docs/product/roadmap/     machine/backlog.json      agile/ (here)           ZenHub (GTCX)
  initiatives/  ─compile─▶  stories[] (P22)  ────▶  intake → planning ──▶  Sprint Backlog
  features/     product:     backlogClear            sprints → qa-uat          (zenhub.md)
  stories/      compile
  (AUTHOR)      (COMPILE)   (CEREMONY)              (BOARD)
```

| Plane        | Home                                                   | Role                                      |
| ------------ | ------------------------------------------------------ | ----------------------------------------- |
| **Author**   | `docs/product/roadmap/{initiatives,features,stories}/` | Plan bodies — human/agent authored        |
| **Compile**  | `machine/backlog.json` (`pnpm product:compile`)        | P22 queue — never hand-edit               |
| **Ceremony** | `agile/`                                               | Process — intake, planning, scrum, UAT    |
| **Board**    | ZenHub workspace **GTCX**                              | [`zenhub.md`](./zenhub.md) label contract |

## Ceremony surface

| File                                                                              | Purpose                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`cpo.md`](./cpo.md)                                                              | CPO connection — agile-os charter + authority boundary |
| [`scorecard.md`](./scorecard.md) · [`pillar-scorecard.md`](./pillar-scorecard.md) | 11-pillar agile rollup                                 |
| [`intake.md`](./intake.md)                                                        | Inbound work, handoffs                                 |
| [`planning.md`](./planning.md)                                                    | Sprint planning, DoR                                   |
| [`qa-uat.md`](./qa-uat.md)                                                        | QA + UAT gates                                         |
| [`zenhub.md`](./zenhub.md)                                                        | Board hygiene, pipelines                               |

## Sync

```bash
pnpm product:compile --write   # docs/product/roadmap → machine/backlog.json
pnpm machine:sync              # machine/backlog.json → operations/machine/backlog.json
```
