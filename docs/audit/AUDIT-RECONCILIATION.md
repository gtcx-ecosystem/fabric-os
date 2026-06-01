# Audit score reconciliation (2026-06-01)

This document explains why historical audits showed different numbers and what is authoritative going forward.

## Authoritative (use these)

| Output                       | Value (2026-06-01 @ `6834b47`) | How to refresh                                        |
| ---------------------------- | ------------------------------ | ----------------------------------------------------- |
| **Internal Readiness (IR)**  | **7.6 / 10**                   | `node tools/scripts/compute-audit-scores.mjs --write` |
| **Certified Readiness (CR)** | **6.6 / 10**                   | same (`composite` = CR)                               |

Rubric: `docs/audit/scoring-rubric.json`  
Human guide: `docs/audit/SCORING.md`

## Retired scores — do not cite in new work

| Source                                       | Claimed                                 | Why retired                                                 |
| -------------------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `master-audit-summary-2026-05-27.md`         | IR **9.0**                              | Hygiene-capped self-assessment before independent re-score  |
| `score-evidence-ledger.json` `core-weighted` | **9.0**                                 | Legacy headline; replaced by IR/CR pair                     |
| `unified-scorecard.json`                     | Partnership **8.8**, Enterprise **7.6** | Different methodology (MAOP grades), not IR/CR              |
| Post-roadmap self-claim                      | IR **8.5**, CR **7.5**                  | Same-session audit; superseded by independent **6.8 / 6.2** |
| Post-roadmap independent                     | IR **6.8**, CR **6.2**                  | Correct for 2026-05-30; ledger + #85 moved IR up            |
| `10-10-remediation` front matter             | **7.6 / 7.6**                           | Assumed gates green while tree dirty (roadmap Q3)           |

## Why scores looked like they “kept dropping”

1. **Different rulers** — 9.0 (gates-only) vs 6.8 (independent + new P0s) was calibration, not necessarily regression.
2. **Two parallel systems** — `latest.json` (7.5/6.6) vs ledger `core-weighted` (9.0) disagreed until 2026-06-01 reconciliation.
3. **Certified stuck** — IR can rise while CR stays ~6.6 until EXT-INF-013/014/002/003 close (fixed **1.0** gap).
4. **Audit prose invented numbers** — sprint projection tables (7.5→8.4) were forecasts, not measurements.

## 2026-06-01 ledger reconciliation commits

Dimension `currentScore` adjustments (history entries at `6834b47`):

| Dimension            | Was | Now     | Reason                                  |
| -------------------- | --- | ------- | --------------------------------------- |
| codeQuality          | 7.7 | **8.0** | 38/38 validate-all post-#85             |
| ecosystemIntegration | 8.3 | **6.8** | contract-matrix needs `GTCX_REPO_TOKEN` |
| agenticMaturity      | 9.6 | **8.2** | SIGNAL 9.6 stays supplementary          |
| enterpriseReadiness  | 9.0 | **6.9** | Structural gates yes; live WORM/DR no   |

`repoHygiene` ledger base stays **8.5**; CI snapshot applies **−0.4** for `main` format failure → **7.9** in IR formula.

## IR / CR stability rules

Scores change only when:

1. A ledger dimension gets a new `history` row (with commit + artifact), or
2. `ci-snapshot.json` is updated (CI penalties), or
3. An `externalAssurancePenalties[].status` flips to `done` in `scoring-rubric.json`.

Running `/full-audit` without the above **must not** produce new headline scores.
