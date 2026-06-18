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

| Source          | Path                                                                                           | Role                                  |
| --------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------- |
| Human inbox     | `pm/_intake/`                                                                                  | Operator-raised items awaiting triage |
| Machine slice   | `ops/pm/backlog.json`                                                                          | Refresh: `pnpm pm:sync`               |
| Fleet backlog   | [`../agile-os/pm/ecosystem-sprint-backlog.json`](../agile-os/pm/ecosystem-sprint-backlog.json) | Cross-repo programme SoR              |
| Bridge handoffs | `docs/operations/coordination/`                                                                | Promoted coordination items           |

## Intake rules

1. **Classify** — story vs task vs cross-repo (XR) vs blocker witness.
2. **Owner** — every item has an owner repo before sprint commitment.
3. **Promote** — fleet-scope items escalate to agile-os intake; do not duplicate fleet backlog bodies here.
4. **Trace** — link PR/commit/witness when closing.

## Open intake

| ID  | Summary | Source | Status |
| --- | ------- | ------ | ------ |
