---
title: 'Product capability matrix — fabric-os'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['overview', 'documentation']
review_cycle: on-change
document_type: overview
goals: 'Hub documentation — overview'
---

# Product capability matrix — fabric-os

> **SoR:** PRD features → shippable capabilities. Stories must trace to a row here or a `prdRef`.

## Active milestone

See `machine/spec/product-goals.json` → `activeMilestone`.

## Capability map

| Capability ID | PRD ref             | Feature              | Shippable outcome      | Status      | Witness                 |
| ------------- | ------------------- | -------------------- | ---------------------- | ----------- | ----------------------- |
| CAP-001       | prd-product-charter | Core product surface | Demoable operator path | in-progress | `pnpm operations:check` |

## Rules

- Every Class R ship claim maps to ≥1 capability row with acceptance evidence.
- `done` stories reference `capabilityId` or `prdRef` in auditNotes.
- Update this matrix when PRD scope changes — not backlog titles alone.
