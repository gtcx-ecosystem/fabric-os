---
title: 'agents/ — agent harness layer'
status: current
date: 2026-06-16
owner: fabric-os
document_type: onboarding
tier: critical
tags: ['documentation', 'agents']
review_cycle: on-change
---

# `docs/agents/` — fabric-os

> **Pack:** [`../../canon-os/pm/spec/docs-agents-pack.json`](../../canon-os/pm/spec/docs-agents-pack.json)  
> **Execution spine:** [`../operations/agent-spine/`](../operations/agent-spine/) · **Session runtime:** [`../../workstream/sessions/`](../../workstream/sessions/)

## Separation

| Layer          | Path                           | Role                                                  |
| -------------- | ------------------------------ | ----------------------------------------------------- |
| **Agents**     | `docs/agents/`                 | Bootstrap, capabilities, playbooks — repo agent slice |
| Agent spine    | `docs/operations/agent-spine/` | P22/P27 universal instructions                        |
| Session ledger | `workstream/sessions/`         | Machine session evidence (baseline P51)               |

## Required subfolders

`bootstrap/` · `capabilities/` · `playbooks/` · `personas/` · `integrations/`
