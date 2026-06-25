---
title: 'DevOps as a Service — per-repo cards'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'devops', 'daas', 'cards']
review_cycle: on-change
---

# DevOps as a Service — per-repo cards

Machine-readable DaaS deployment cards for product repos consuming fabric-os substrate.

| Repo          | Card                                                 |
| ------------- | ---------------------------------------------------- |
| terminal-os   | [`cards/terminal-os.md`](./cards/terminal-os.md)     |
| compliance-os | [`cards/compliance-os.md`](./cards/compliance-os.md) |
| markets-os    | [`cards/markets-os.md`](./cards/markets-os.md)       |

## Gate

```bash
pnpm daas:cards:check
pnpm daas:cards:check:write
```
