---
title: 'Docs index (agent manifest)'
status: current
date: '2026-06-19'
owner: fabric-os
document_type: index
tier: critical
review_cycle: on-change
---

# Documentation index — fabric-os

Agent manifest (P48 thin instance). **Human map:** [README.md](README.md)

## Fleet normative (link — do not duplicate)

- **Read order + layers:** [canon-os IA-PILLAR-MAP.md](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/docs-ia/IA-PILLAR-MAP.md)
- **Docs root contract:** [docs-root-contract.json](https://github.com/gtcx-ecosystem/canon-os/blob/main/pm/spec/docs-root-contract.json)
- **Docs root spec:** [canon-os 00-docs-root](https://github.com/gtcx-ecosystem/canon-os/blob/main/pm/spec/docs-folders/00-docs-root.json)
- **Path variants:** [sor.json](sor.json)

## Forbidden at docs/ root

overview/, specs/, strategy/ at root — decompose to canonical layers. agile/, agents/ under docs/.

## Repo-specific entry paths

| Concern    | Path                         |
| ---------- | ---------------------------- |
| Foundation | [`foundation/`](foundation/) |
| Product    | [product/](product/)         |

## Gates

```bash
pnpm docs:ia:check
```
