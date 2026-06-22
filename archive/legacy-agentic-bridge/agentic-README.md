---
title: 'Agentic bridge'
status: current
date: 2026-06-18
owner: fabric-os
role: platform-architect
tier: standard
tags: ['agentic', 'bridge', 'governance']
review_cycle: on-change
---

# Agentic bridge

`fabric-os` uses `agentic/` as a thin Protocol 33 bridge for agent runtime discovery. Runtime implementation remains in the platform and ops hubs; this directory only declares the agentic bridge contract required by the ecosystem layout gate.

## Contents

- [`manifest.json`](./manifest.json) — machine-readable bridge manifest.

## Boundaries

Do not place runtime code, platform packages, PM plans, docs hubs, or ops domains under this directory. Use `platform/`, `machine/`, `docs/`, and `operations/` for those concerns.
