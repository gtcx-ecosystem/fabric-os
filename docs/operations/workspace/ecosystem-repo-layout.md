---
title: 'Ecosystem repo layout v5'
status: current
date: 2026-06-18
owner: fabric-os
role: platform-architect
tier: standard
tags: ['workspace', 'layout', 'p35']
review_cycle: on-change
document_type: overview
related:
  - ../../../config/layout-contract.json
---

# Ecosystem repo layout v5

This repo follows the P35 v5 hub layout declared in [`config/layout-contract.json`](../../../config/layout-contract.json).

## Root hubs

`fabric-os` root hubs are:

- `agentic/`
- `archive/`
- `audit/`
- `deploy/`
- `docs/`
- `ops/`
- `platform/`
- `pm/`
- `workstream/`

Numbered legacy hubs are migration aliases only and do not satisfy strict layout gates.

## Docs hub

The `docs/` hub contains narrative, reference, and operational documentation. Ops-domain system-of-record artifacts live in `ops/`; docs may point to them but should not duplicate ops domain manifests.

## Enforcement

Run the strict layout and ops gates before closing governance changes:

```bash
pnpm check:workspace-root-cleanliness:strict
pnpm ops:check
```
