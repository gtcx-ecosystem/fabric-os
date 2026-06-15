---
title: 'Pen-test window scheduled — SECAS-S2-01'
status: current
date: 2026-06-10
owner: fabric-os
tier: operating
tags: [['coordination', 'pen-test', 'secas-s2']]
review_cycle: on-change
document_type: runbook
program: INIT-GTCX-INFRA-SECAS
storyId: SECAS-S2-01
authorityClass: A
---

# Pen-test window scheduled

**Witness:** [`audit/archive/2026-06-14/audit/evidence/pen-test-window-2026-06-10.json`](../../../audit/archive/2026-06-14/audit/evidence/pen-test-window-2026-06-10.json)

## Window

| Field       | Value               |
| ----------- | ------------------- |
| Start       | 2026-06-17          |
| End         | 2026-06-21          |
| TZ          | Africa/Johannesburg |
| Environment | staging             |

## Prerequisites met

| Check                               | Status                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| EXT-INF-002 sovereign + countersign | approved 2026-06-10                                          |
| Fleet health                        | PASS 4/4 @ 2026-06-10T09:27:04Z                              |
| Intake pack                         | `audit/pen-test-scope-2026.md`, `audit/pen-test-rfp-2026.md` |

## Remaining

| Step                            | Owner     | Status         |
| ------------------------------- | --------- | -------------- |
| Vendor executes live-stack test | Vendor    | during window  |
| Report ingest                   | fabric-os | pending        |
| Close SEC-PENTEST-01            | fabric-os | pending report |
