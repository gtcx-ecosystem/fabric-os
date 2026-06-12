---
title: Service fabric compass
status: current
date: 2026-06-12
owner: fabric-os
initiative: INIT-GTCX-COMPASS-FABRIC
---

# Service fabric compass

Single probe surface for **INIT-GTCX-COMPASS-FABRIC** — validates friction registers from `bridge-os/pm/spec/service-fabric.json` and runs DaaS/SECaaS assurance runners per roadmaps.

## What it checks

| Layer     | Scope                                                                          |
| --------- | ------------------------------------------------------------------------------ |
| Registers | All `service-fabric.json` friction registers present in fabric-os              |
| Roadmaps  | `pm/daas-roadmap.json`, `pm/secas-roadmap.json`, HaaS, AaaS                    |
| Runners   | `daas:*`, `secas:*`, `haas:*`, `aaas:*`, `fabric-assurance`, `taas-tool-scout` |

## Commands

```bash
pnpm fabric:compass:check
pnpm fabric:compass:check:write   # writes audit/evidence/service-fabric-compass-latest.json
```

## Witness

`audit/evidence/service-fabric-compass-latest.json`

**Machine spec:** `bridge-os/pm/spec/service-fabric.json`
