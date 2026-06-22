---
title: 'ADR-001 architecture baseline'
status: current
date: 2026-06-16
owner: fabric-os
document_type: adr
tier: critical
tags: ['documentation', 'architecture']
review_cycle: on-change
---

# ADR-001: Architecture baseline — fabric-os

## Status

Proposed

## Context

**Fabric OS** maintains technical truth under `docs/architecture/` per `docs-architecture-pack.json`.

## Decision

- Specs live under `specs/{backend,frontend,data,design,testing}/`
- Architecture decisions are recorded only as `ADR-NNN-*.md` under `decisions/`
- Machine evidence remains in `operations/` and `audit/`; product UX in `docs/product/`

## Consequences

- Fleet IA checks enforce content bar (ADR + spec nests)
- New ADRs supersede this baseline when accepted
