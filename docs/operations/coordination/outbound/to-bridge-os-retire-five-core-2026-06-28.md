---
title: 'Outbound — retire/integrate legacy five-core audit so MPR is the single live path'
status: sent
date: 2026-06-28
from: fabric-os
to: [bridge-os]
ticket: XR-RETIRE-FIVE-CORE-001
authorityClass: A
protocol: P24
blocksIR: false
owner: bridge-os
document_type: runbook
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# To bridge-os — retire (or integrate) the legacy five-core audit

**One-line read:** the session self-audit (finding E5) confirmed the **legacy five-core / composite
audit still runs in bridge-os** in parallel with the new MPR + SIGNAL framework — `run-five-core-audit.mjs`,
`run-composite-lift.mjs`, `five-core-rubric-score.mjs` still execute and regenerate probe-gates audit
reports across repos. The new framework was supposed to _supersede_ it (per the repo CLAUDE.md:
legacy per-concern audits are "retired in favor of the 11-pillar MPR taxonomy"), but in practice
it's a **parallel island**, not a replacement. Two audit systems running = drift, double witnesses, confusion.

## Evidence

- `bridge-os/platform/scripts/ecosystem/run-five-core-audit.mjs` + `run-composite-lift.mjs` +
  `lib/five-core-rubric-score.mjs` present and live.
- They generate `*-audit-YYYY-MM-DD.md` + `*-audit-latest.json` (agentic-innovation / compliance-security /
  product-excellence / production-grade / repository-provisioning, "probe-gates-only") — fabric-os just archived a
  set of these as residue.
- fabric-os now owns the canonical AaaS surface: `aaas:audit --lens mpr|signal|all`, the lifecycle loop
  (`aaas:loop`), handoff/honesty/ownership/cadence — all on `main`.

## Requested (bridge-os)

1. Decide: **retire** five-core (the MPR engine you already own is the single scorer), or **integrate**
   any unique five-core probes into the MPR pillar rubric.
2. Stop the parallel report generation, or route it through the MPR taxonomy so there is ONE audit path.
3. Coordinate the cutover so repos aren't left with stale five-core witnesses next to MPR ones.

## fabric-os position

- `blocksIR: false` — both systems "work"; this is consolidation, not an outage. But until it's resolved,
  the ecosystem has two competing audit truths.
- fabric-os owns the AaaS orchestration lane; the **MPR scoring engine + its legacy five-core predecessor
  are bridge-os's** to reconcile. Surfacing for the owner to decide.
