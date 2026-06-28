---
title: 'Outbound — reconcile audit command registries to canonical surface (canon-os + bridge-os)'
status: sent
date: 2026-06-28
from: fabric-os
to: [canon-os, bridge-os]
initiative: INIT-GTCX-SERVICE-FABRIC
ticket: XR-AUDIT-COMMAND-RECONCILE-001
authorityClass: A
protocol: P24
blocksIR: false
owner: [canon-os, bridge-os]
evidence: machine/spec/aaas-command-surface.json
---

# To canon-os + bridge-os — reconcile audit command registries to the canonical surface

**One-line read:** fabric-os locked the canonical AaaS standard (taxonomy + contract + command surface). The fleet scrub of legacy audits is **gated on retiring the producers** — the command registries you own. Until they reconcile, archived witnesses regenerate and agents keep invoking legacy commands.

Canonical surface (SoR): `fabric-os/machine/spec/aaas-command-surface.json`
Taxonomy: `fabric-os/machine/spec/aaas-audit-taxonomy.json` (11 pillars, 87 micros)

## Requested (registry reconcile — front 2 of the scrub)

**canon-os:**

- `platform/tools/audit/audit-framework/commands.json` — map every command to the canonical `aaas:*` surface or RETIRE; drop five-core/legacy entries.
- `platform/tools/audit/audit-engine/{catalog,checks,dimensions,frameworks}.json` — reconcile dimensions to the 11-pillar / micro taxonomy (the dimensions ARE the micros).

**bridge-os:**

- `platform/tools/audit-framework/commands.json` — reconcile to the canonical surface.
- `audit/FIVE-CORE-AUDITS.md` — five-core (A1–A5) is **superseded by the 11-pillar MPR**; mark retired, point to the taxonomy.
- Engine: `audit:mpr:repo:run` stays as the single scorer `aaas:audit` delegates to; **retire `audit:five-core:run`** and stop emitting the superseded five-core witnesses (else the fabric-os scrub re-bloats).

## Why this gates the scrub

fabric-os's `aaas:scrub` dry-run = **571 legacy files across 20 repos**. Archiving them is futile until the engine + registries stop producing them. Order: registries(2) → scripts/slash(3,4) → agent-files(5) → archive-files(1).

## fabric-os position

- Standard + contract + scrub tooling built, committed, pushed. `blocksIR: false`.
- Once registries reconcile, fabric-os runs `aaas:scrub:write` + the agent-file/script scrub fleet-wide.

## Ack template

```markdown
## outbound-ack — audit command registry reconcile

- **Status:** ack | in-progress | done
- **Owner:** canon-os / bridge-os
- **Evidence:** commit SHA · commands.json reconciled · five-core retired
```
