---
title: 'compliance roadmap'
status: current
date: 2026-06-17
owner: fabric-os
document_type: roadmap
tier: critical
tags: ['documentation', 'roadmap', 'agile']
review_cycle: on-change
---

# Compliance & security roadmap — fabric-os

Assurance programme, SOC 2, SECAS engineering witnesses. **Vendor calendar deferred-post-launch — not an engineering block.**

| SoR                  | Path                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| SECAS execution      | [`audit/product-management/secas-execution-roadmap.md`](../../audit/product-management/secas-execution-roadmap.md)                 |
| Post-launch external | [`operations/coordination/post-launch-external-gates.json`](../../ops/coordination/post-launch-external-gates.json)                |
| Internal closure     | [`audit/evidence/secas-s4-04-internal-closure-2026-06-17.json`](../../audit/evidence/secas-s4-04-internal-closure-2026-06-17.json) |

## Programme status

| Track                        | Phase                       | Engineering impact            |
| ---------------------------- | --------------------------- | ----------------------------- |
| SECAS internal               | `internal_closure_complete` | None — Class R sealed         |
| SOC 2 Type II (`BL-SOC2-01`) | Awaiting auditor opinion    | None — `blocksAnyRepo: false` |
| Vendor pen-test (`BG-10-10`) | deferred-post-launch        | None — calendar witness only  |
