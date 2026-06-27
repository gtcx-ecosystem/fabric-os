---
title: 'Outbound — assurance-apparatus P0s (bridge-os)'
status: sent
date: 2026-06-27
from: fabric-os
to: bridge-os
initiative: INIT-GTCX-SERVICE-FABRIC
ticket: XR-ASSURANCE-APPARATUS-001
related: [ASR-001, ASR-002, ASR-003, ASR-006]
authorityClass: A
protocol: P24
blocksIR: false
owner: bridge-os
evidence: audit/assurance-apparatus-mpr-audit-2026-06-27.md
---

# To bridge-os — assurance-apparatus P0s (you own the engine SoR)

**One-line read:** The cross-repo MPR audit found the audit System-of-Record
(bridge-os) is the lowest-scoring apparatus in the fleet (~55/100) — strongest
design, weakest operation. Four findings below are engine-owned; fabric-os has
fixed its own consumer-side instances but cannot fix the root causes from here.

Full audit + per-repo scores: `fabric-os/audit/assurance-apparatus-mpr-audit-2026-06-27.md`.

## Findings (bridge-os-owned)

| ID      | Sev | What                                                                                                                                                                                                                                                                                                                | Where                                                                                                                                   |
| ------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| ASR-002 | P0  | **Score laundering** — aggregation rolls `score100:0 / confidence:D / source:missing` metrics into a high core score (fabric-os A5 = 100 from three empty metrics). Root cause is the rollup, not the consumer.                                                                                                     | `platform/scripts/lib/five-core-rubric-score.mjs` (rollup); `seed-five-core-witnesses.mjs` (`score10 = master?.score ?? 8` fabrication) |
| ASR-003 | P0  | **No enforcement chokepoint** — `run-mpr-repo-audit` / `run-five-core-audit` appear in no workflow; drift checks gated behind `vars.GTCX_ECOSYSTEM_ROOT != ''` so they skip on normal PRs. A repo can score 20/100 and merge green.                                                                                 | `.github/workflows/ci.yml`; `ecosystem:five-core-audits:check` gating                                                                   |
| ASR-001 | P0  | **Dead evidence automation** — `evidence.yml:34` + `ci.yml:197` invoke `03-platform/scripts/evidence/generate-evidence.mjs` (Layout-v5 path; repo uses `platform/`). The SoR's own evidence pipeline is dead on every run; `audit/latest.json` points at a missing `mpr-repo-latest.json`.                          | `.github/workflows/evidence.yml:34`, `ci.yml:197`, `audit/latest.json`                                                                  |
| ASR-006 | P1  | **Taxonomy sprawl + supersede contradiction** — three scoring vocabularies (five-core A1–A5, MPR 11-pillar, orphaned 10-dim `UNIVERSAL_RUBRIC.md`); `mpr-evaluation.json:7` declares `five-core-scoring.json` superseded yet `run-five-core-audit.mjs:21` still loads it. Weight model duplicated with baseline-os. | `platform/tools/audit-framework/UNIVERSAL_RUBRIC.md`, `pm/spec/mpr-evaluation.json:7`, `run-five-core-audit.mjs:21`                     |

## Required (root-cause fixes only bridge-os can make)

1. **ASR-002:** rollup must cap a core at its lowest _real_ metric when any metric is `missing`/`D`, or mark the core `provisional` — never aggregate absence into a high score. Retire `seed-five-core-witnesses.mjs` `?? 8`.
2. **ASR-003:** add a blocking CI step running `run-mpr-repo-audit --repo bridge-os` that fails below pillar thresholds; un-gate the drift check from `GTCX_ECOSYSTEM_ROOT`.
3. **ASR-001:** repair the `03-platform/` paths in `evidence.yml`/`ci.yml`; generate bridge-os's own `mpr-repo-latest.json`.
4. **ASR-006:** pick one pillar SoR (`mpr-evaluation.json`), rewrite `UNIVERSAL_RUBRIC.md` to the 11 pillars, delete the superseded `five-core-scoring.json` and repoint the loader.

## fabric-os position

- Consumer-side already fixed: honesty gate now **detects** hollow composites (`noHollowCores`, commit `5ed0f90f`) and fabric CI path drift is repaired (`ac6d47c9`). fabric-os now honestly fails its own gate on the A5 100 until ASR-002 root cause clears.
- `blocksIR: false` — fabric-os engineering continues; this is the audit framework's own maturity.

## Ack template

```markdown
## outbound-ack — assurance-apparatus P0s

- **Status:** ack | in-progress | done
- **Owner:** bridge-os
- **Evidence:** commit SHA · rollup caps hollow cores · MPR gate in ci.yml · evidence.yml path fixed
```
