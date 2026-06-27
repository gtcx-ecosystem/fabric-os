---
title: 'Assurance Apparatus — Cross-Repo MPR Audit'
status: current
date: 2026-06-27
owner: fabric-os
document_type: audit
lens: MPR
tier: operating
tags: ['audit', 'assurance', 'mpr', 'cross-repo', 'aaas']
review_cycle: on-change
scope:
  repos: [bridge-os, canon-os, baseline-os, agile-os, fabric-os]
  dimensions: [protocols, audits, reports, provisions, enforcement]
  goals: [centralize, revamp, streamline, operationalize, enforce]
findings:
  - id: ASR-001
    severity: P0
    pillar: technicalExcellence
    title: Layout-v5 numbered-path drift breaks CI fleet-wide (audit gates unreachable)
    repos: [fabric-os, bridge-os]
    owner: each-repo
    status: fabric-os-fixed
  - id: ASR-002
    severity: P0
    pillar: compliance
    title: Score laundering — hollow composites roll zero/missing metrics into high scores
    repos: [fabric-os, bridge-os, canon-os]
    owner: bridge-os
    status: fabric-gate-now-detects
  - id: ASR-003
    severity: P0
    pillar: defensiveMoat
    title: No enforcement chokepoint — scores block nothing in CI/pre-push fleet-wide
    repos: [bridge-os, baseline-os, agile-os, fabric-os]
    owner: bridge-os
    status: open
  - id: ASR-004
    severity: P1
    pillar: productEcosystemIntegration
    title: Empty canon registries — coverage denominator is ~1 capability fleet-wide
    repos: [canon-os, fabric-os, baseline-os, bridge-os]
    owner: canon-os
    status: open
  - id: ASR-005
    severity: P1
    pillar: agenticEmpowerment
    title: Open narrative-audit loop — findings die in markdown, no pm:ingest-signals
    repos: [agile-os]
    owner: agile-os
    status: open
  - id: ASR-006
    severity: P1
    pillar: technicalExcellence
    title: Taxonomy sprawl + weight-model duplication (3 vocabularies; baseline↔bridge dup)
    repos: [bridge-os, baseline-os]
    owner: bridge-os
    status: open
  - id: ASR-007
    severity: P1
    pillar: productEcosystemIntegration
    title: No audit cadence — all on-demand; witnesses rot (5–13 days stale)
    repos: [bridge-os, fabric-os, baseline-os]
    owner: baseline-os
    status: open
---

# Assurance Apparatus — Cross-Repo MPR Audit

**Lens:** MPR (Multi-Pillar Readiness, 11 pillars). **Method:** five parallel
per-repo auditors (bridge-os, canon-os, baseline-os, agile-os, fabric-os), each
scoring the assurance apparatus across protocols / audits / reports / provisions /
enforcement. Lead-with-worst; no silent caps — every claim cites a path.

## Thesis (worst finding, fleet-wide)

**The ecosystem measures and specifies assurance everywhere and enforces it
nowhere.** Every repo has sophisticated audit machinery that is _advisory in
practice_ because it is disconnected from a mandatory chokepoint (CI, cadence,
or backlog intake). The audit System-of-Record itself (bridge-os) cannot produce
a current self-witness, and the consumer (fabric-os) ran its honesty gate behind
a CI job that crashed before reaching it. Confident, formatted scores sit atop
unenforced, partially-broken pipelines — the same "scored the map, not the
territory" failure the honesty gate was built to stop, now observed at the
apparatus level.

## Apparatus ownership map

| Repo            | Role in apparatus | Owns                                                               |
| --------------- | ----------------- | ------------------------------------------------------------------ |
| **bridge-os**   | Engine SoR        | five-core + MPR runners, universal rubric, probes/gates/caps       |
| **canon-os**    | Capability SoR    | canon registry synthesis, governance protocols, audit dimensions   |
| **baseline-os** | Spec/operator SoR | 11-pillar spec, MPR fleet boundary, operator commands, cost router |
| **agile-os**    | Roadmap SoR       | audit→backlog intake, assurance-escalation chain, sprint gates     |
| **fabric-os**   | AaaS lane         | composite/honesty consumption, fabric assurance witnesses          |

## Verified findings (lead with worst)

### ASR-001 · P0 · Layout-v5 path drift breaks CI fleet-wide

Numbered paths (`03-platform/`, `04-deploy/`, `01-docs/`) that no longer exist
are referenced by CI. **fabric-os** `ci.yml` had 79 such refs; the job died at
step 4 (`audit-with-acceptance.mjs`), making the honesty gate and every gate
below it unreachable — green-by-omission. **bridge-os** repeats it in
`evidence.yml:34` + `ci.yml:197` (`03-platform/scripts/evidence/generate-evidence.mjs`),
so the audit SoR's own evidence automation is dead on every run.
→ **fabric-os FIXED this session** (commit `ac6d47c9`, verified all paths resolve;
two non-obvious special cases: score-ledger at `audit/`, nested `deploy/03-platform/`).
bridge-os equivalent is open.

### ASR-002 · P0 · Score laundering (hollow composites)

`fabric-os/audit/evidence/composite-audit-latest.json` core **A5-REPO-HYGIENE
reports `score100: 100`** while all three of its metrics are
`score100: 0, confidence: D, source: missing`. bridge-os
`seed-five-core-witnesses.mjs` fabricates witnesses (`score10 = master?.score ?? 8`).
canon-os `mpr-canon-layer-latest.json` publishes 11 `null` pillar scores under a
stub. The aggregation launders absence into high scores.
→ **fabric-os honesty gate now detects this** (commit `5ed0f90f`, new
`noHollowCores` gate inspecting `cores[].metrics`); fabric-os now honestly fails
its own gate until the bridge-os aggregation is fixed. Root-cause fix is the
aggregation in bridge-os (`lib/five-core-rubric-score.mjs`) — open.

### ASR-003 · P0 · No enforcement chokepoint

No repo hard-blocks on score. baseline-os MPR is absent from `ci.yml` (scrub gate
is naming-only). bridge-os scoring engines appear in no workflow; drift checks are
gated behind `vars.GTCX_ECOSYSTEM_ROOT != ''` and skip on normal PRs. agile-os's
30+ gates live in `operations:check` (`package.json:185`) which **no CI/pre-push
ever invokes**. A repo can score 20/100 and merge green.

### ASR-004 · P1 · Empty canon registries (no coverage denominator)

Across 7 repos sampled, ~**1 populated capability total** (fabric-os's one
`FEAT-FABRIC-OPS-ASSURANCE`). canon-os is `status: current` but models itself as
6 services / 0 features; 6 siblings are empty `draft`. An ecosystem honesty gate
computed against this denominator passes trivially. Populate-the-registries is the
precondition for fleet-wide honesty enforcement.

### ASR-005 · P1 · Open narrative-audit loop

agile-os closes the loop for _structured_ signals (assurance-escalation chain,
ship-gate intake) but has **no machine ingest for narrative audits** — five-core
reports, remediation notes, and _this report_ die in markdown. No
`pm:ingest-signals` exists. Findings reach humans, not the backlog (50 stories;
none traced to recent audit files).

### ASR-006 · P1 · Taxonomy sprawl + weight duplication

bridge-os runs **three** scoring vocabularies: five-core A1–A5, MPR 11-pillar,
and an orphaned 10-dimension `UNIVERSAL_RUBRIC.md` that neither engine consumes.
`mpr-evaluation.json:7` declares `five-core-scoring.json` superseded, yet
`run-five-core-audit.mjs:21` still loads it. The weight/threshold model is
duplicated between `baseline-os/.../fractal-multi-pillar-weight-calibration.json`
and `bridge-os/.../five-pillar-evaluation.json`.

### ASR-007 · P1 · No cadence; witnesses rot

Nothing runs audits on a schedule fleet-wide. bridge-os composite is 13 days
stale; fabric-os five-pillar 5 days. baseline-os's nightly `ecosystem-ci.yml`
cron runs no MPR. All assurance is on-demand.

## MPR apparatus scores (per auditor)

| Repo                | Composite   | Weakest pillar                    | Strongest pillar               |
| ------------------- | ----------- | --------------------------------- | ------------------------------ |
| baseline-os         | ~74         | technicalExcellence 68 (advisory) | agenticEmpowerment 82          |
| agile-os            | ~68         | technicalExcellence 58 (unwired)  | productEcosystemIntegration 80 |
| canon-os            | ~62         | ipMagic 55 (unbuilt)              | technicalExcellence 70         |
| fabric-os           | ~57         | defensiveMoat 48 (non-blocking)   | productEcosystemIntegration 70 |
| bridge-os           | ~55         | defensiveMoat 50 (unenforced)     | agenticEmpowerment 60          |
| **Fleet apparatus** | **≈63/100** | **enforcement**                   | **provisions**                 |

The inversion is the story: **bridge-os, the SoR, scores lowest** — strongest
design, weakest operation. Maturity is inversely correlated with how central the
repo is to the apparatus.

## Consolidated roadmap (by goal)

### CENTRALIZE

- One pillar SoR in bridge-os; make `mpr-evaluation.json` authoritative and rewrite
  `UNIVERSAL_RUBRIC.md` against the 11 pillars (ASR-006).
- Collapse the weight model to one source (baseline `fractal-...calibration.json`
  _or_ bridge `five-pillar-evaluation.json`, not both).
- Canon-os owns one capability→pillar coverage matrix consumed by every repo.

### REVAMP

- Fix bridge-os dead automation path (`evidence.yml:34`, `ci.yml:197`) and generate
  bridge-os's own `mpr-repo-latest.json` (ASR-001).
- Fix the hollow-composite aggregation in bridge-os so a core cannot exceed its
  lowest real metric when metrics are `missing`/`D` (ASR-002).
- Land real scores into canon-os `mpr-canon-layer-latest.json`; create the missing
  `docs-canon-latest.json`. Resolve the `pm/spec` ↔ `machine/spec` path contract.

### STREAMLINE

- Retire `seed-five-core-witnesses.mjs` (`?? 8` fabrication). Consolidate the
  five-core vs MPR runners behind one scope-flagged runner.
- Canon-os: consolidate ~270 scripts (100+ `fleet-docs-*` triplets) behind
  parameterized runners; one protocol numbering scheme.

### OPERATIONALIZE

- Add a scheduled fleet MPR run to `ecosystem-ci.yml` (already nightly cron) that
  invokes the bridge runner per repo and lands witnesses (ASR-007).
- Build `agile-os` `ingest-audit-signals.mjs`: parse witness JSON + audit-md
  frontmatter → upsert backlog stories with `intakeSource`/`severity`/`pillar`
  (ASR-005). **This report's frontmatter is structured for exactly that.**
- fabric-os: ship AAAS-S3 (nightly `aaas:friction:check:write` + `aaas:honesty:check:write`).

### ENFORCE

- bridge-os: blocking CI step running `run-mpr-repo-audit --repo <self>` failing on
  below-threshold pillars; un-gate drift checks from `GTCX_ECOSYSTEM_ROOT` (ASR-003).
- agile-os: wire `operations:check` (or a subset) into `ci.yml`; add a sprint-close
  gate failing on any open `intakeSource:*audit*` P0 story.
- baseline-os: add MPR composite floor + witness-staleness gate to CI.
- fabric-os: flip honesty gate `aaas:honesty:check` to blocking once ASR-002 +
  ASR-004 clear (AAAS-S3).

## Fixed this session (fabric-os, Class R)

- **ASR-001** — CI path drift repaired; all gates reachable (`ac6d47c9`).
- **ASR-002** — honesty gate now detects hollow composites; catches the live
  fabric-os A5 100 (`5ed0f90f`).

## Method note

Five parallel read-only auditors; findings cross-verified against witness shapes.
No coverage caps applied silently. The single largest residual blind spot:
witnesses are self-reported per repo — this audit scored the _apparatus_, not a
re-run of every underlying probe. ASR-003/007 (enforcement + cadence) are the
fixes that would make the apparatus self-verifying rather than audited by hand.
