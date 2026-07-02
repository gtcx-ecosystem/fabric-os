---
title: 'DaaS card — markets-os (pilot reference)'
status: delivered
date: 2026-06-10
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
laneId: L4b
deployProduct: GTCX Cloud
friction: XR-MKT-011
productOwner: markets-os
protocol: P40 + P41
---

# DaaS card: markets-os (XR-MKT-011 pilot)

## Profile

| Field                     | Value                                                |
| ------------------------- | ---------------------------------------------------- |
| **laneId**                | **L4b** — market exchange & investment               |
| **deployProduct**         | **GTCX Cloud** (AGX module — ADR-007)                |
| `deployment-profile.json` | `markets-os/docs/operations/deployment-profile.json` |
| Pilot                     | `INIT-GTCX-INFRA-DEPLOY`                             |
| Handoff                   | `to-fabric-os-s39-01-authority-routes-2026-06-10.md` |

## Seal witness

| Gate                           | Result                                                                      |
| ------------------------------ | --------------------------------------------------------------------------- |
| `GET /api/health`              | **200**                                                                     |
| `pnpm authority:trace:capture` | **7/7** exit **0**                                                          |
| Seal doc                       | `from-fabric-os-s39-01-authority-routes-2026-06-10.md` status **delivered** |

Reference card for DAAS-S2 ingress matrix pattern.
