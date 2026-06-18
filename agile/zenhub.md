---
title: 'zenhub — board hygiene'
status: current
date: 2026-06-16
owner: fabric-os
document_type: protocol
tier: operating
tags: ['documentation', 'agile']
review_cycle: on-change
---

# Zenhub — fabric-os

Board hygiene and label contract for workspace **GTCX**.

## Bindings

| Artifact       | Path                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Fleet plan SoR | [`../agile-os/pm/zenhub-plan.json`](../agile-os/pm/zenhub-plan.json)                                       |
| Label registry | [`../bridge-os/config/zenhub-ecosystem-registry.json`](../bridge-os/config/zenhub-ecosystem-registry.json) |
| Repo plan      | (none — inherit fleet plan)                                                                                |

## Label contract

| Level        | ZenHub type | Default pipeline |
| ------------ | ----------- | ---------------- |
| Goal         | Initiative  | Icebox           |
| Initiative   | Project     | Product Backlog  |
| Epic         | Epic        | Product Backlog  |
| Story / Task | Issue       | Sprint Backlog   |

## Hygiene rules

- Every sprint item has **estimate**, **owner repo**, and **pipeline** set.
- Cross-repo blockers use `dependsOn` — witness in agile-os plan rollup.
- No orphan issues: every open issue maps to an epic or initiative.
- Close issues only with witness link (PR, audit path, or ops evidence).

## Commands

```bash
pnpm ecosystem:zenhub:plan    # dry-run plan (from agile-os / bridge-os)
pnpm ecosystem:zenhub:apply   # apply when green
```
