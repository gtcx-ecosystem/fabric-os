---
title: 'Inbound — ledger-ui QASC spec-scoring completion gap'
status: resolved
date: 2026-07-01
from: ledger-ui
to: fabric-os
story: QASC-SPEC-SCORING-001
authorityClass: R
protocol: P24
sourceCommit: ddf51705
resolutionCommit: 4d822bbf
owner: fabric-os
document_type: coordination-handoff
tier: operating
tags: [fabric-os, ledger-ui, qasc, coordination]
review_cycle: on-change
---

# Inbound — ledger-ui QASC Spec-Scoring Completion Gap

## Request

ledger-ui filed
`operations/coordination/outbound/to-fabric-os-qasc-spec-scoring-2026-07-01.md`
at commit `ddf51705`. The request was to make product/folder/file spec
alignment a distinct scored QASC row and to assert the row in fabric-os contract
and scorer tests.

## Resolution

fabric-os resolved the request in commit `4d822bbf`:

- Added `Folder/file/product spec alignment` to the QASC acceptance table.
- Added `folderFileSpecs` to the scored phase loop.
- Added command evidence for `docs:product:check`, `docs:tree:check`, and
  `machine:folder:check` when those scripts are available.
- Added the row to `machine/spec/qasc-contract.json`.
- Added the requirement to `machine/spec/qasc-audit-requirements.json`.
- Updated tests so production-package rows and the new spec-alignment row are
  mandatory.

## Verification

| Command                                       | Exit | Evidence                                  |
| --------------------------------------------- | ---: | ----------------------------------------- |
| `pnpm qasc:contract:check`                    |    0 | `100/100`, `12/12` contract controls      |
| `pnpm qasc:test`                              |    0 | `11/11` tests                             |
| `pnpm docs:tree:check`                        |    0 | `96/96`                                   |
| `pnpm operations:check`                       |    0 | root hygiene PASS                         |
| `pnpm qasc:repo -- --repo ledger-ui --json`   |    1 | row present; ledger-ui remains incomplete |
| `pnpm qasc:fleet -- --repos fabric-os --json` |    0 | fabric-os `97/100`, `28/29`               |

ledger-ui scorer extraction after patch:

```json
{
  "area": "Folder/file/product spec alignment",
  "score100": 39,
  "benchmark100": 100,
  "evidence": "local specs 5; docs:product exit 0; docs:tree 39/100; machine:folder exit 0; driftRecorded=true"
}
```

## Remaining Boundary

fabric-os QASC is below `100/100` only because the worktree contains a
concurrent deployment evidence modification owned by another agent:

```text
M audit/evidence/codebuild-deploy-start-latest.json
```

Do not revert, stage, or commit that evidence as part of this QASC response.
