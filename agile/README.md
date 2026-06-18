---
title: 'agile/ — local ceremony workspace'
status: current
date: 2026-06-16
owner: fabric-os
document_type: overview
tier: operating
tags: ['documentation', 'agile']
review_cycle: on-change
---

# `agile/` — fabric-os

> **Pack:** [`../../canon-os/pm/spec/agile-pack.json`](../../canon-os/pm/spec/agile-pack.json)  
> **Fleet CPO:** [`../agile-os/docs/strategy/fleet-agile-hub.md`](../agile-os/docs/strategy/fleet-agile-hub.md) · [`cpo.md`](./cpo.md)  
> **11-pillar scorecard:** [`pillar-scorecard.md`](./pillar-scorecard.md)  
> **Reference impl:** [`../agile-os/agile/`](../agile-os/agile/)

## CPO loop

`OBSERVE → ANTICIPATE → DECIDE → EXECUTE → VERIFY → LEARN`

## Ceremony surface

| File                                           | Purpose                                                     |
| ---------------------------------------------- | ----------------------------------------------------------- |
| [`cpo.md`](./cpo.md)                           | CPO connection — agile-os charter + repo authority boundary |
| [`pillar-scorecard.md`](./pillar-scorecard.md) | 11-pillar self-assessment (≥85/100 target)                  |
| [`intake.md`](./intake.md)                     | Inbound work, handoffs, backlog intake                      |
| [`planning.md`](./planning.md)                 | Sprint planning, prioritization rubric, DoR                 |
| [`qa-uat.md`](./qa-uat.md)                     | QA gates + UAT plan and evidence                            |
| [`zenhub.md`](./zenhub.md)                     | Board hygiene, label contract                               |

## Sync

`pnpm pm:sync` → `ops/pm/backlog.json`
