---
title: 'intake — backlog and handoffs'
status: current
date: 2026-06-16
owner: fabric-os
document_type: runbook
tier: operating
tags: ['documentation', 'agile']
review_cycle: on-change
---

# Intake — fabric-os

Repo-local inbound work before P22 selection.

## Sources

| Source          | Path                                                                                           | Role                                             |
| --------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Human inbox     | `machine/_intake/`                                                                             | Operator-raised items awaiting triage            |
| Author plane    | [`docs/product/roadmap/`](../docs/product/roadmap/README.md)                                   | Plan bodies — compile via `pnpm product:compile` |
| Machine queue   | [`machine/backlog.json`](../machine/backlog.json)                                              | P22 queue (compiled — do not hand-edit)          |
| Machine slice   | `operations/machine/backlog.json`                                                              | Refresh: `pnpm machine:sync`                     |
| Fleet backlog   | [`../agile-os/pm/ecosystem-sprint-backlog.json`](../agile-os/pm/ecosystem-sprint-backlog.json) | Cross-repo programme SoR                         |
| Bridge handoffs | `docs/operations/coordination/`                                                                | Promoted coordination items                      |

## Intake rules

1. **Classify** — story vs task vs cross-repo (XR) vs blocker witness.
2. **Owner** — every item has an owner repo before sprint commitment.
3. **Promote** — fleet-scope items escalate to agile-os intake; do not duplicate fleet backlog bodies here.
4. **Trace** — link PR/commit/witness when closing.

## Open intake

| ID  | Summary | Source | Status |
| --- | ------- | ------ | ------ |
