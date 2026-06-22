---
title: 'XR-BRIDGE-TOOL-SCOUT-001 acknowledgement'
status: current
date: 2026-06-18
owner: fabric-os
document_type: coordination
tier: operating
tags: ['coordination', 'taas', 'tool-scout', 'fabric']
review_cycle: on-change
---

# XR-BRIDGE-TOOL-SCOUT-001 acknowledgement

Fabric OS acknowledges the Bridge OS Tool Scout handoff for
`INIT-AGENT-TOOL-SCOUT`.

## Scope

- Maintain `machine/tool-adoption-register.json`.
- Track Fabric-owned pilot witnesses under `audit/evidence/`.
- Consume Bridge OS `machine/tool-scout-register.json` as the program register.
- Keep the tool scout runner country-agnostic.

## Verification

```bash
pnpm taas:tool-scout:run
pnpm taas:tool-scout:run:write
```
