---
title: Agent Work Selection Manifest
status: current
date: 2026-06-22
owner: fabric-os
tier: critical
tags: [protocol-22, protocol-26, protocol-27, protocol-28, agents, roadmap, autonomy]
review_cycle: on-change
document_type: runbook
role: platform-architect
document_id: OPS-AWS-FAB-001
protocol: canon-os/docs/governance/protocols/22-agent-work-selection/protocol.md
adoption_status: established
---

# Agent Work Selection — fabric-os

Protocol 22 is **established** in this repo. Agents compute the next work unit from machine-readable backlog state. **Never ask the operator to choose** among backlog items when `pnpm agent:next-work` returns a story.

## Protocols in force

| Protocol | Topic                              | Gate                          |
| -------- | ---------------------------------- | ----------------------------- |
| **22**   | Work selection                     | `pnpm agent:next-work`        |
| **24**   | Cross-repo coordination            | `operations/coordination/`    |
| **26**   | Proceed Brief + Status Update      | `.cursor/rules/protocol-26-*` |
| **27**   | Agent execution (you run commands) | `.cursor/rules/protocol-27-*` |
| **28**   | Authority class R/A/S              | `.cursor/rules/protocol-28-*` |

## Canonical paths (P35 v5)

| Purpose                 | Path                                                 |
| ----------------------- | ---------------------------------------------------- |
| Work-selection manifest | `docs/operations/agent-init/agent-work-selection.md` |
| Selection command       | `platform/scripts/agent-next-work.mjs`               |
| Machine backlog         | `machine/backlog.json`                               |
| Execution roadmap       | `audit/product-management/execution-roadmap.md`      |
| Auto-dev state          | `audit/product-management/auto-dev-state.md`         |
| Session memory          | `.baseline/memory/session.md`                        |
| Audit entry             | `audit/AGENT-START.md`                               |

## Commands

```bash
pnpm agent:next-work
pnpm agent:work-selection:check
pnpm session
pnpm ops:check
pnpm fabric:assurance:run:write
```

## Hub reference

Fleet hub manifest: [`bridge-os/docs/operations/agent-work-selection.md`](https://github.com/gtcx-ecosystem/bridge-os/blob/main/docs/operations/agent-work-selection.md)
