---
title: 'Formal print instances'
status: current
date: 2026-06-30
owner: fabric-os
document_type: overview
tier: reference
review_cycle: on-change
---

# Formal print instances (fabric-os)

Product-scoped JSON for branded PDFs. Fleet legal kits and Word masters live in **canon-os** only.

| Resource           | Path                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fleet architecture | [FLEET-PRINT-PUBLISHING](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/docs-ia/FLEET-PRINT-PUBLISHING.md)                               |
| Reference sample   | [baseline-os tear-sheet](https://github.com/gtcx-ecosystem/baseline-os/blob/main/docs/reference/templates/formal/instances/baseline-os-tear-sheet.sample.json) |

Add instances here; render with `pnpm --dir ../bridge-os ecosystem:print:publish render --type <type> --instance <path>`.
