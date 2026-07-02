---
title: 'QASC deletion preservation fleet audit'
status: current
date: 2026-07-02
owner: fabric-os
authority: GTCX-QASC-001
version: 1.0.0
---

# QASC Deletion Preservation Fleet Audit

Fleet score: **100/100**.

Window: **2026-06-02T00:00:00** through **2026-07-02T09:26:12.209Z**.

Policy: tracked files must not be removed as unrecoverable bare deletes during
repo cleanup. Retired, superseded, or decomposed content must have exact mirrored
coverage under `archive/_delete/<original-path>` plus forensic provenance under
`archive/_delete/by-commit/<commit>/<original-path>`.

| Repository     |   Score | Historical | Exact coverage | Current worktree | Remediation owner | First blocker     |
| -------------- | ------: | ---------: | -------------: | ---------------: | ----------------- | ----------------- |
| agile-os       | 100/100 |    100/100 |        496/496 |          100/100 | fabric-os         | benchmark reached |
| baseline-os    | 100/100 |    100/100 |        802/802 |          100/100 | fabric-os         | benchmark reached |
| bridge-os      | 100/100 |    100/100 |        971/971 |          100/100 | fabric-os         | benchmark reached |
| canon-os       | 100/100 |    100/100 |      1884/1884 |          100/100 | fabric-os         | benchmark reached |
| compliance-os  | 100/100 |    100/100 |      1694/1694 |          100/100 | fabric-os         | benchmark reached |
| ecosystem-os   | 100/100 |    100/100 |      1113/1113 |          100/100 | fabric-os         | benchmark reached |
| exploration-os | 100/100 |    100/100 |        706/706 |          100/100 | fabric-os         | benchmark reached |
| fabric-os      | 100/100 |    100/100 |      1632/1632 |          100/100 | fabric-os         | benchmark reached |
| griot-ai       | 100/100 |    100/100 |        539/539 |          100/100 | fabric-os         | benchmark reached |
| gtcx-os        | 100/100 |    100/100 |    10921/10921 |          100/100 | fabric-os         | benchmark reached |
| inspection-os  | 100/100 |    100/100 |          54/54 |          100/100 | fabric-os         | benchmark reached |
| ledger-os      | 100/100 |    100/100 |          43/43 |          100/100 | fabric-os         | benchmark reached |
| ledger-ui      | 100/100 |    100/100 |        704/704 |          100/100 | fabric-os         | benchmark reached |
| markets-os     | 100/100 |    100/100 |        895/895 |          100/100 | fabric-os         | benchmark reached |
| nyota-ai       | 100/100 |    100/100 |        774/774 |          100/100 | fabric-os         | benchmark reached |
| sensei-os      | 100/100 |    100/100 |      4397/4397 |          100/100 | fabric-os         | benchmark reached |
| terminal-os    | 100/100 |    100/100 |      4313/4313 |          100/100 | fabric-os         | benchmark reached |
| terra-os       | 100/100 |    100/100 |      2335/2335 |          100/100 | fabric-os         | benchmark reached |
| venture-os     | 100/100 |    100/100 |          90/90 |          100/100 | fabric-os         | benchmark reached |
| veritas-ai     | 100/100 |    100/100 |        204/204 |          100/100 | fabric-os         | benchmark reached |

## Notes

- This audit is intentionally historical. It does not rewrite history.
- Historical gaps require forward-repair archive commits with exact mirrored
  coverage and by-commit provenance.
- Current bare deletes must be converted to archive/\_delete moves before commit.
- Delegated repositories remain in the denominator; their remediation owner is
  marked only for coordination.

Machine witness: `audit/evidence/qasc-deletion-preservation-audit-latest.json`.
