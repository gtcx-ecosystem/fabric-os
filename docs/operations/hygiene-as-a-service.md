---
title: 'Hygiene-as-a-Service (HaaS)'
status: current
date: 2026-06-12
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
initiative: INIT-GTCX-SERVICE-FABRIC
---

# Hygiene-as-a-Service — GTCX Service Fabric

**Machine spec:** `bridge-os/pm/spec/service-fabric.json`  
**Friction SoR:** `pm/hygiene-friction-register.json`  
**Roadmap SoR:** `pm/haas-roadmap.json`  
**Fleet tool:** `@gtcx/hygiene` via `bridge-os/03-platform/tools/hygiene/`

## Obligation

Repo folder hygiene, session layout, and root allowlist violations are centralized in fabric-os. Product repos consume `hygiene.config.json` and link `ops/` manifests — no duplicate hygiene backlog in product `pm/`.

## Product interface

1. Run `pnpm ops:check` (includes layout + workspace gates)
2. On fleet hygiene friction → inbound ticket to fabric-os
3. Class R: `gtcx-hygiene check` in owner repo when configured

## Operator entry

```bash
pnpm haas:friction:check
pnpm haas:friction:check:write
pnpm --dir ../bridge-os ecosystem:fabric:check
```
