# Canonical audit scoring — gtcx-infrastructure

**Single source of truth:** run `node tools/scripts/compute-audit-scores.mjs --write` and read `docs/audit/latest.json`.

## Two headline scores only

| ID     | Name                | Alias                             | Meaning                                                       |
| ------ | ------------------- | --------------------------------- | ------------------------------------------------------------- |
| **IR** | Internal Readiness  | `internalReadiness`               | What the repo controls: code, gates, structural ops evidence. |
| **CR** | Certified Readiness | `certifiedReadiness`, `composite` | What an auditor/regulator can trust **today**.                |

### Formulas (fixed — do not improvise)

```
IR = Σ (dimensionScore × weight)     # 7 dimensions, weights sum to 1.0
CR = IR − externalAssuranceGap       # gap capped at 2.0
```

- Dimension scores start from `docs/audit/score-evidence-ledger.json` (`currentScore`).
- CI penalties from `docs/audit/ci-snapshot.json` (e.g. `main` format failure → `repoHygiene −0.4`).
- External gap = sum of open penalties in `docs/audit/scoring-rubric.json` → `externalAssurancePenalties`.

**Current open penalties (1.0 total):** EXT-INF-013, EXT-INF-014, EXT-INF-002, EXT-INF-003.

## Seven dimensions (weights)

| Dimension             | Weight | Ledger id                 |
| --------------------- | ------ | ------------------------- |
| codeQuality           | 15%    | `code-quality`            |
| repoHygiene           | 12%    | `repo-hygiene`            |
| security              | 15%    | `security`                |
| globalSouthResilience | 10%    | `global-south-resilience` |
| ecosystemIntegration  | 10%    | `ecosystem-integration`   |
| agenticMaturity       | 13%    | `agentic-maturity`        |
| enterpriseReadiness   | 25%    | `enterprise-readiness`    |

## What full audits must do

1. Run `node tools/scripts/compute-audit-scores.mjs --markdown` and paste the **Canonical Scorecard** block at the top.
2. Use **Strong / Good / Pass** in phase scorecards — not new X/10 numbers.
3. Do **not** publish sprint “before → 8.4” projection tables; use qualitative impact instead.
4. To change a score: append a ledger `history` entry with commit + artifact, then re-run `--write`.

## Supplementary metrics (report separately)

| Metric            | Where                                       | Do not use as IR/CR   |
| ----------------- | ------------------------------------------- | --------------------- |
| SIGNAL            | `signal` ledger id, `signal-scorecard.json` | Yes — supplementary   |
| Core weighted 9.0 | `core-weighted` ledger id                   | **Retired**           |
| Partnership 8.8   | `unified-scorecard.json`                    | **Retired**           |
| GTM S0–S6         | Phase 3 of full audit                       | Stage labels, not /10 |

## Files

| File                         | Role                                         |
| ---------------------------- | -------------------------------------------- |
| `scoring-rubric.json`        | Weights, penalties, rules (machine-readable) |
| `score-evidence-ledger.json` | Append-only dimension history                |
| `ci-snapshot.json`           | Current CI truth for automatic penalties     |
| `latest.json`                | Output of `--write`                          |
| `AUDIT-RECONCILIATION.md`    | Why old scores differ                        |
