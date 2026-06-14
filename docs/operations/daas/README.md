---
title: DevOps & InfraOps — per-repo cards
status: current
date: 2026-06-14
owner: fabric-os
protocol: P41-DEVOPS-AS-A-SERVICE
opsLanes: [DevOps, InfraOps]
---

# DevOps & InfraOps per-repo cards

> **Functional product:** DaaS · **Registry:** [ops-programs.md](../ops-programs.md)

Machine-indexed operational cards for fabric-os primary roadmap (DAAS-S2+).

| Card                                      | Friction   | Deploy mode       | Status      |
| ----------------------------------------- | ---------- | ----------------- | ----------- |
| [terminal-os](./cards/terminal-os.md)     | F1         | EKS static        | delivered   |
| [compliance-os](./cards/compliance-os.md) | F2         | EKS multi-service | in_progress |
| [markets-os](./cards/markets-os.md)       | XR-MKT-011 | EKS handoff       | delivered   |

**Harness:** `pnpm daas:cards:check` · witness `audit/evidence/daas-cards-check-latest.json`
