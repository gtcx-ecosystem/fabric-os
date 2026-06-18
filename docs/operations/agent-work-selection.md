---
title: 'Agent work selection'
status: current
date: 2026-06-18
owner: fabric-os
role: platform-architect
tier: standard
tags: ['agents', 'protocol-22', 'work-selection']
review_cycle: on-change
protocol: '22-agent-work-selection'
adoption_status: established
related:
  - ../../audit/product-management/execution-roadmap.md
  - ../../audit/product-management/auto-dev-state.md
  - ../../platform/scripts/agent-next-work.mjs
---

# Agent work selection

`fabric-os` uses Protocol 22 to compute the next executable story from the repo roadmap and work register. Agents must run `pnpm agent:next-work` before selecting implementation work.

## Source of record

- Roadmap: [`audit/product-management/execution-roadmap.md`](../../audit/product-management/execution-roadmap.md)
- Session pointer: [`audit/product-management/auto-dev-state.md`](../../audit/product-management/auto-dev-state.md)
- Selection script: [`platform/scripts/agent-next-work.mjs`](../../platform/scripts/agent-next-work.mjs)
- Adoption check: `pnpm agent:work-selection:check`

## Operating rule

Execute the returned in-repo Class R story. Skip `external` and manual evidence-capture items unless the required Class A or Class S artifact already exists.
