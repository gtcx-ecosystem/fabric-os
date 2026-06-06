---
title: 'Engineering audit — gtcx-infrastructure'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
role: quality-evidence-lead
audit_lane: engineering-completeness-quality
audit_command: engineering-audit
baseline_commit: 6a70f4c
audit_quality_1to10: 9.0
readiness_signoff: 5.0
readiness_completion: 7.8
readiness_lane_score: 7.1
tier: critical
tags: ['audit', 'engineering', 'lane-1', 'forensic', 'layout-v3']
review_cycle: quarterly
related:
  - engineering-completeness-quality-2026-06-06.md
  - engineering-audit-2026-06-07.md
  - migration-complete-2026-06-06.md
  - full-audit-2026-06-01.md
---

# Engineering audit — gtcx-infrastructure (lane 1)

> **Lane 1 only.** Not bank-grade 8.3 or GCR tier.  
> **Methodology:** [engineering-scoring.md](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/03-platform/tools/audit/lane-scoring/engineering-scoring.md)  
> **Repo:** `gtcx-infrastructure` @ `6a70f4c` · **Auditor:** Cursor agent (`/full-audit` → `engineering-audit`)

**Delta since [`engineering-audit-2026-06-07.md`](./engineering-audit-2026-06-07.md) @ `c181138`:** Layout v3 migration series landed (`d2ad032`…`6a70f4c`). **Fixed:** turbo `lint` + `typecheck` (Jun 7 P1 regressions on `@gtcx/audit-signer` / `@gtcx/deployment-guard`). **Regressed:** `validate-all` **50/50 → 33/55**; `pnpm format:check` (65 files); `pnpm test` (docs-standard link); Protocol 22 adoption check **0/9** — root cause is stale pre-v3 paths in validator scripts (`tools/` → `03-platform/tools/`, `docs/` → `01-docs/`, `infra/` → `04-deploy/`).

---

## 1. Executive summary

Lane 1 engineering readiness **dropped on signoff** despite structural migration completion. Individual turbo gates (`lint`, `typecheck`, `build`) and security sub-gates (FIPS, audit-sink, replay-protection coverage) remain strong. The **orchestration layer regressed**: 22 of 55 `validate-all` gates fail with `ENOENT` on legacy paths, and `pnpm test` fails on a single broken docs link after 56 package tests pass.

**Weighted lane score: 7.1/10** (down from 7.9 @ `c181138`). **P0:** post-migration validator path drift (22 gates). **P1:** format debt, docs-standard link, P22 check ROOT bug, compliance-data coverage import. **P2:** console.log lint warnings; migration-complete witness overstates gate green at `d2ad032`.

---

## 2. Gate results (Protocol 27 — in-session @ `6a70f4c`)

| Gate            | Command                                                           | Exit  | Notes                                                                                            |
| --------------- | ----------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| Format          | `pnpm format:check`                                               | **1** | 65 markdown/yaml files fail Prettier (mostly `01-docs/audit/*`, runbooks, agent onboarding)      |
| Lint            | `pnpm lint`                                                       | 0     | 18/18 turbo tasks; warnings only (`no-console` on CLI packages)                                  |
| Typecheck       | `pnpm typecheck`                                                  | 0     | 18/18 turbo tasks                                                                                |
| Test (quick)    | `pnpm test`                                                       | **1** | 56/56 package tests pass; fails at docs-standard step — broken link in `agent-command-lookup.md` |
| Build           | `pnpm build`                                                      | 0     | 15/15 turbo tasks                                                                                |
| Architecture    | `pnpm architecture:check`                                         | N/A   | Not defined in root `package.json`                                                               |
| Validate-all    | `node 03-platform/tools/scripts/validate-all.mjs`                 | **1** | **33/55 PASS**, 22 FAIL — see §4 ENG-P0                                                          |
| Environment CI  | `node 03-platform/tools/control-plane/gtcx-ctl.mjs validate --ci` | 0     | staging + production kustomize offline                                                           |
| SIGNAL          | `node 03-platform/tools/scripts/validate-signal.mjs`              | 0     | 9.60/10                                                                                          |
| Protocol 22     | `pnpm agent:work-selection:check`                                 | **1** | 0/9 — `ROOT` resolves to `03-platform/` not repo root; manifest paths still `01-docs/04-ops/`    |
| Workspace root  | `pnpm check:workspace-root-cleanliness:strict`                    | 0     | (via validate-all Static Validators)                                                             |
| Readiness lanes | `pnpm readiness:lanes:check` (gtcx-core)                          | 0     | SSOT + anti-drift                                                                                |

---

## 3. Six-dimension scorecard

| #   | Dimension             | Weight |   Score | Rationale                                                                                                   |
| --- | --------------------- | -----: | ------: | ----------------------------------------------------------------------------------------------------------- |
| 1   | CI / quality gates    |    25% | **5.5** | Turbo lint/typecheck/build pass; format + test + validate-all fail                                          |
| 2   | Package completeness  |    20% | **8.0** | 15 workspace packages wired; ADR-019 exemptions documented; validator paths not updated post-v3             |
| 3   | Test depth            |    20% | **7.5** | Per-package tests pass; coverage gates fail on path drift (`compliance-data` import, coverage-honesty scan) |
| 4   | Crypto / safety hooks |    15% | **8.5** | FIPS mode, audit-sink guard, replay-protection coverage, secret-scan pass in validate-all                   |
| 5   | Operational signals   |    10% | **7.5** | gtcx-ctl preflight + SIGNAL 9.60; LLM-ops / DR / soak baselines fail on moved paths                         |
| 6   | Doc–code fidelity     |    10% | **5.5** | Migration-complete claims 100/100 while validators reference `tools/`, `docs/`, `infra/` at repo root       |

**Weighted lane score** = 5.5×0.25 + 8.0×0.20 + 7.5×0.20 + 8.5×0.15 + 7.5×0.10 + 5.5×0.10 = **7.05 → 7.1**

| Readiness metric |   Value | Basis                                               |
| ---------------- | ------: | --------------------------------------------------- |
| Gate signoff     | **5.0** | format, test, validate-all, P22 check fail at HEAD  |
| Completion depth | **7.8** | Package matrix + security sub-gates + SIGNAL intact |
| Lane headline    | **7.1** | Weighted sum (documented above)                     |

---

## 4. Findings

### ENG-P0 — Post-v3 validator path drift (22 validate-all gates)

- **Severity:** P0
- **Evidence:** `validate-all` exit 1 — 33/55 pass. Representative stale paths:
  - `03-platform/tools/scripts/coverage-honesty-check.mjs:14` → `resolve(REPO_ROOT, 'tools')` (should be `03-platform/tools`)
  - `03-platform/tools/scripts/npm-publish-readiness-check.mjs:12-13` → `tools/audit-signer`, `tools/compliance-data`
  - `03-platform/tools/scripts/jurisdiction-catalog-parity-check.mjs:11` → `tools/compliance-data/jurisdictions.json`
  - `03-platform/tools/scripts/runtime-evidence-check.mjs:13` → `tools/control-plane/generate-release-evidence.mjs`
  - `03-platform/tools/scripts/soc2-agent-owners-check.mjs` → `docs/gtm/regulatory/soc2-readiness-checklist.md`
  - `03-platform/tools/scripts/validate-trace-correlation.mjs` → `01-docs/04-ops/coordination/cross-repo-agent-log.md`
  - `03-platform/tools/scripts/validate-prompt-semver.mjs` → `01-docs/05-audit/prompts/...`
  - `03-platform/tools/scripts/run-injection-suite-witness.mjs` → doubled `03-platform/03-platform/tools/...`
  - `03-platform/tools/scripts/cloudflared-api-gateway-check.mjs` → `infra/kubernetes/...`
  - `03-platform/tools/scripts/terraform-registry-readiness-check.mjs` → `infra/terraform/modules/...`
  - `03-platform/tools/scripts/pen-test-intake-evidence.mjs` → `docs/audit/pen-test-scope-2026.md`
  - `03-platform/tools/scripts/dr-fire-drill-evidence.mjs` → `dr-test.sh` path / evidence dir
  - `03-platform/tools/scripts/soak-baseline-check.mjs` / `ussd-soak-baseline-check.mjs` → missing baseline files at new paths
- **Impact:** Orchestrated CI witness regressed from 50/50 (@ `c181138`) to 33/55; blocks honest lane-1 signoff ≥ 8.0
- **Fix:** Batch-update validator `ROOT` joins to v3 hub map (`config/ops.manifest.json` aliases); re-run `validate-all` until 55/55

### ENG-P1 — `pnpm format:check` debt (65 files)

- **Severity:** P1
- **Evidence:** `pnpm format:check` exit 1 — 65 files under `01-docs/` (audit corpus, runbooks, agent onboarding)
- **Impact:** Root CI format gate fails; blocks clean signoff
- **Fix:** `pnpm format` scoped to changed docs or full repo format pass + commit

### ENG-P1 — Docs-standard broken cross-repo link blocks `pnpm test`

- **Severity:** P1
- **Evidence:** `01-docs/operations/agent-command-lookup.md` → `../../../gtcx-core/01-docs/operations/agent-git-workflow.md` (target missing in sibling checkout)
- **Impact:** `pnpm test` exit 1 after 56 passing package tests (`validate.sh quick`)
- **Fix:** Link to canonical gtcx-docs URL or stub inbound ticket; add to docs-exceptions if external-only

### ENG-P1 — Protocol 22 adoption check wrong ROOT

- **Severity:** P1
- **Evidence:** `03-platform/scripts/check-agent-work-selection.mjs:11` — `ROOT = join(__dirname, '..')` resolves to `03-platform/` not repo root; manifest expected at `01-docs/04-ops/agent-work-selection.md` but SoR is `01-docs/operations/agent-work-selection.md`
- **Impact:** `pnpm agent:work-selection:check` exit 1 — 0/9 checks
- **Fix:** `ROOT = join(__dirname, '../..')`; update manifest/roadmap paths to post-v3 locations

### ENG-P1 — `@gtcx/compliance-data` coverage gate import drift

- **Severity:** P1
- **Evidence:** `03-platform/tools/compliance-data/tests/signature.test.mjs` imports `03-platform/scripts/verify-catalog.mjs` (doubled path); exit 1 on `test:coverage:gate`
- **Impact:** validate-all Coverage Gates fail for compliance-data
- **Fix:** Correct import to `../scripts/verify-catalog.mjs`

### ENG-P2 — CLI `no-console` lint warnings (non-blocking)

- **Severity:** P2
- **Evidence:** `@gtcx/deployment-guard`, `@gtcx/control-plane`, `@gtcx/audit-flush`, `@gtcx/anomaly-detector`, `@gtcx/eval-pipeline`, `@gtcx/docs-site` — warnings only; turbo lint exit 0
- **Fix:** Route CLI output through allowed methods or eslint override for CLI entrypoints

### ENG-P2 — Migration-complete witness overstates gate green

- **Severity:** P2
- **Evidence:** [`05-audit/evidence/migration-complete-2026-06-06.md`](../../05-audit/evidence/migration-complete-2026-06-06.md) claims `pnpm test` exit 0 @ `d2ad032`; HEAD `6a70f4c` `pnpm test` exit 1
- **Fix:** Re-score migration health after validator path sweep; do not mark `migrationComplete: true` until `validate-all` returns 55/55

### Resolved since engineering-audit 2026-06-07

- **ENG-P1 audit-signer lint (closed):** `pnpm lint` exit 0 @ HEAD
- **ENG-P1 deployment-guard typecheck (closed):** `pnpm typecheck` exit 0 @ HEAD

---

## 5. Evidence gaps

| Gap                         | Lane owner           | Notes                                                                                                                          |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `architecture:check` script | Platform Engineering | Not in root manifest — use validate-all policy gates as substitute                                                             |
| Deployment-audit domain     | Lane 1 input         | No `deployment-audit-*.md` <30d in-repo; cite [`bank-grade-audit-2026-06-07`](./bank-grade-audit-2026-06-07.md) enterprise dim |
| Live DR/WORM recurrence     | Operator / XC        | EXT-INF-003 — not lane-1 engineering                                                                                           |
| Dual audit tree             | Docs hygiene         | Forensics live in `01-docs/audit/`; `latest.json` still cites `01-docs/05-audit/` paths — reconcile in index pass              |

---

## 6. Index + `latest.json` update checklist

- [x] Forensic: `01-docs/audit/engineering-audit-2026-06-06.md` (this file)
- [x] Index: `01-docs/audit/engineering-completeness-quality-2026-06-06.md`
- [x] `latest.json` → `lanes.engineeringCompletenessQuality`
- [x] Do **not** mix with `lanes.bankGrade.certifiedComposite` (8.3)

---

## Agent Context Attestation

- [x] Protocol 27: gates run in-session with exit codes
- [x] Protocol 28: Class R audit authoring
- [x] Lane 1 scoring protocol applied; bank-grade composite not cited as engineering score
