---
title: 'architecture/ — system design SoR'
status: current
date: 2026-06-16
owner: fabric-os
document_type: architecture
tier: critical
tags: ['documentation', 'architecture']
review_cycle: on-change
---

# `docs/architecture/` — fabric-os

> **Pack:** [`../../canon-os/pm/spec/docs-architecture-pack.json`](../../canon-os/pm/spec/docs-architecture-pack.json)  
> **Foundation:** [`../../archive/legacy-docs-top-level/foundation/`](../../archive/legacy-docs-top-level/foundation/) · **Business:** [`../../archive/legacy-docs-top-level/business/`](../../archive/legacy-docs-top-level/business/)

## Cross-reference

| Layer            | Path                                        | Role                                |
| ---------------- | ------------------------------------------- | ----------------------------------- |
| Foundation       | `archive/legacy-docs-top-level/foundation/` | Why — charter, vision, goals        |
| Business         | `archive/legacy-docs-top-level/business/`   | Market and customer context         |
| **Architecture** | `docs/architecture/`                        | How — specs, ADRs, integration      |
| Reference        | `docs/reference/`                           | Templates only (post-decomposition) |

## Subfolders

| Folder         | Contents                                       |
| -------------- | ---------------------------------------------- |
| `specs/`       | Backend, frontend, data, design, testing specs |
| `decisions/`   | ADR-\* architecture decision records           |
| `integration/` | Cross-service and fleet integration            |
| `pillars/`     | 11-pillar audit narrative                      |
| `security/`    | Threat models (link `ops/security/`)           |
