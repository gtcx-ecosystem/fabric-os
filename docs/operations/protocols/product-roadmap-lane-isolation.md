---
title: 'Product roadmap lane isolation'
status: current
date: 2026-06-17
owner: fabric-os
tier: operating
tags: ['protocol', 'documentation']
review_cycle: on-change
document_type: protocol
---

# Product roadmap lane isolation

**Canonical spec:** [`canon-os/pm/spec/product-roadmap-lane-isolation-protocol.json`](../../../canon-os/pm/spec/product-roadmap-lane-isolation-protocol.json)

## Rule

| Roadmap                                     | Owner                          | P22 | Contains                                  |
| ------------------------------------------- | ------------------------------ | --- | ----------------------------------------- |
| **Technical / product**                     | Engineering + design           | Yes | Class R stories only                      |
| **GTM · Legal · Partnerships · Compliance** | Commercial / Legal / Assurance | No  | Pilots, LOI, countersign, vendor calendar |
| **Business (rollup)**                       | Executive lens                 | No  | Composes all lanes                        |

External gates (e.g. `BM-ZM-PILOT-01` MMMD countersign when technical readiness PASS) live in:

- [`ops/coordination/human-gates.manifest.json`](../../ops/coordination/human-gates.manifest.json)
- [`agile/roadmaps/partnerships.md`](../../agile/roadmaps/partnerships.md)

They **must not** appear on `pm/backlog.json`, `pm/execution-roadmap.md`, or P22 **Next work item**.

## Verify

```bash
pnpm product-roadmap:lane:check:write
pnpm --dir ../bridge-os ecosystem:product-roadmap:lane:check:write
```
