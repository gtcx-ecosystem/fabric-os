---
title: Audit-as-a-Service (AAAS)
status: current
date: 2026-06-12
owner: fabric-os
initiative: INIT-GTCX-SERVICE-FABRIC
---

# Audit-as-a-Service — GTCX Service Fabric

**Normative:** `bridge-os/pm/spec/five-core-audits.json`  
**Harness owner:** bridge-os (`audit:five-core:run`, `ecosystem:audit:five-core:fleet`)  
**Execution owner:** fabric-os (friction triage + witness publish)  
**Friction SoR:** `pm/audit-friction-register.json`

## Obligation

Five-core audit witnesses (A1–A5) are executed via bridge-os harness; fabric-os owns operational friction when fleet audit scores block deploy or compliance lanes.

## Product interface

1. Witness sink: `audit/evidence/*-audit-latest.json` per repo
2. Independent lane: bridge-os `ecosystem:ten-ten:score` — not self-attestation
3. Class S gates (`EXT-INF-002`, pen-test SOW) → **Approval needed** only (`blocksIR: false`)

## Operator entry

```bash
pnpm aaas:friction:check
pnpm aaas:friction:check:write
pnpm --dir ../bridge-os audit:five-core:run -- --repo fabric-os --write
```
