---
title: 'agents/ — agent harness layer'
status: current
date: 2026-06-22
owner: fabric-os
document_type: onboarding
tier: critical
tags: ['documentation', 'agents']
review_cycle: on-change
---

# `agents/` — fabric-os

> **Pack:** [`machine/spec/agents-pack.json`](../machine/spec/agents-pack.json)  
> **Agent init:** [`docs/operations/agent-init/`](../docs/operations/agent-init/) · **Machine SoR:** [`operations/`](../operations/) (alias [`ops/`](../ops/) shim)

## Separation

| Layer       | Path                          | Role                                                  |
| ----------- | ----------------------------- | ----------------------------------------------------- |
| **Agents**  | `agents/`                     | Bootstrap, capabilities, playbooks — repo agent slice |
| Agent init  | `docs/operations/agent-init/` | P22/P27 universal instructions                        |
| Machine ops | `operations/`                 | P29 domain manifests — link only                      |

## Required subfolders

`bootstrap/` · `capabilities/` · `playbooks/` · `personas/` · `integrations/`

## Session

```bash
pnpm agent:next-work --json   # exit 0
pnpm agents:check             # exit 0
```
