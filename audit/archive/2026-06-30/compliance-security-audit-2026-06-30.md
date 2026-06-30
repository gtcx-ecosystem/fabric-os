# Global compliance, security & trust — fabric-os (2026-06-30)

**Score:** 75/100 (raw 100) · **Status:** rubric-driven

## Metrics (0–100 rubric categories)

| Dimension               | Score | Weight | Confidence | Source       |
| ----------------------- | ----: | -----: | ---------- | ------------ |
| security                |   100 |      1 | A          | audit-output |
| enterprise-readiness    |   100 |      1 | A          | audit-output |
| bank-grade-auditability |   100 |      1 | A          | audit-output |

## Gates (pass/fail ceilings)

| Gate                          | Result | Severity | Cap if fail |
| ----------------------------- | ------ | -------- | ----------- |
| security-scan-clean-or-waived | PASS   | P0       | 59          |
| secrets-no-leak               | PASS   | P0       | 50          |
| trust-evidence-indexed        | FAIL   | P1       | 75          |

## Caps fired

- **gate-trust-evidence-indexed** → ceiling 75 (trust-evidence-indexed)

## Gaps

- assuranceWorkspace
