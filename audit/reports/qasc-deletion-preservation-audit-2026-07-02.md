---
title: 'QASC deletion preservation fleet audit'
status: current
date: 2026-07-02
owner: fabric-os
authority: GTCX-QASC-001
version: 1.0.0
---

# QASC Deletion Preservation Fleet Audit

Fleet score: **45/100**.

Window: **2026-06-02T00:00:00** through **2026-07-02T02:59:33.209Z**.

Policy: tracked files must not be removed as bare deletes during repo cleanup.
Retired, superseded, or decomposed content must be preserved under
`archive/_delete/<reason-date>/...` so Git records a recoverable relocation.

| Repository     |  Score | Historical | Current worktree | Remediation owner | First blocker                                                                                            |
| -------------- | -----: | ---------: | ---------------: | ----------------- | -------------------------------------------------------------------------------------------------------- |
| agile-os       | 50/100 |      0/100 |          100/100 | fabric-os         | 161 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| baseline-os    | 50/100 |      0/100 |          100/100 | delegated-agent   | 155 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| bridge-os      | 50/100 |      0/100 |          100/100 | delegated-agent   | 353 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| canon-os       | 50/100 |      0/100 |          100/100 | delegated-agent   | 108 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| compliance-os  | 50/100 |      0/100 |          100/100 | fabric-os         | 284 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| ecosystem-os   | 50/100 |      0/100 |          100/100 | fabric-os         | 192 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| exploration-os | 50/100 |      0/100 |          100/100 | fabric-os         | 344 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| fabric-os      | 50/100 |      0/100 |          100/100 | fabric-os         | 433 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| griot-ai       | 50/100 |      0/100 |          100/100 | fabric-os         | 61 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation  |
| gtcx-os        | 51/100 |      2/100 |          100/100 | fabric-os         | 64 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation  |
| inspection-os  |  0/100 |      0/100 |            0/100 | fabric-os         | 8 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation   |
| ledger-os      | 50/100 |      0/100 |          100/100 | fabric-os         | 6 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation   |
| ledger-ui      | 50/100 |      0/100 |          100/100 | fabric-os         | 329 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| markets-os     | 50/100 |      0/100 |          100/100 | fabric-os         | 301 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| nyota-ai       | 50/100 |      0/100 |          100/100 | fabric-os         | 57 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation  |
| sensei-os      | 50/100 |      0/100 |          100/100 | fabric-os         | 191 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| terminal-os    | 50/100 |      0/100 |          100/100 | fabric-os         | 365 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| terra-os       | 50/100 |      0/100 |          100/100 | fabric-os         | 425 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation |
| venture-os     | 50/100 |      0/100 |          100/100 | fabric-os         | 14 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation  |
| veritas-ai     |  0/100 |      0/100 |            0/100 | fabric-os         | 28 commit(s) since 2026-06-02T00:00:00 contain bare tracked deletes without archive/\_delete relocation  |

## Notes

- This audit is intentionally historical. It does not rewrite history.
- Historical gaps require forward-repair archive commits when the content is
  materially useful or policy-critical.
- Current bare deletes must be converted to archive/\_delete moves before commit.
- Delegated repositories remain in the denominator; their remediation owner is
  marked only for coordination.

Machine witness: `audit/evidence/qasc-deletion-preservation-audit-latest.json`.
