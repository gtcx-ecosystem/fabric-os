---
title: 'Outbound — ledger-ui QASC remediation scorecard'
status: current
date: 2026-07-01
from: fabric-os
to: ledger-ui
story: QASC-SPEC-SCORING-001
authorityClass: R
protocol: P24
owner: fabric-os
document_type: coordination-handoff
tier: operating
tags: [fabric-os, ledger-ui, qasc, coordination]
review_cycle: on-change
---

# To ledger-ui — QASC Remediation Scorecard

## Context

fabric-os implemented ledger-ui handoff `ddf51705` in commit `4d822bbf` and
acknowledged it in commit `e96b8739`.

The QASC scorer now includes `Folder/file/product spec alignment` as a distinct
scored row and verifies repo-local product, tree, and machine-folder checks
where available.

## Current ledger-ui score

Command:

```bash
pnpm qasc:fleet -- --repos fabric-os,ledger-ui --json
```

Result for ledger-ui:

| Area                               | Score / state | Evidence                                                           |
| ---------------------------------- | ------------: | ------------------------------------------------------------------ |
| QASC repository score              |        49/100 | `13/28` controls at benchmark                                      |
| MPR composite                      |       100/100 | `audit/evidence/mpr-repo-latest.json`                              |
| SIGNAL maturity                    |         0/100 | missing SIGNAL witness                                             |
| Folder/file/product spec alignment |        39/100 | `docs:product exit 0`; `machine:folder exit 0`; `docs:tree 39/100` |

The new spec-alignment row is working: it does not hide behind passing
`docs:product:check` or `machine:folder:check`; it remains below benchmark
because `docs:tree:check` is below benchmark.

## Remediation order

1. Restore documentation tree hygiene to `100/100`.
   - Evidence now: `docs IA 100/100; tree 39/100; links 0/100`
   - Primary command: `pnpm docs:tree:check`
   - Secondary command: `pnpm docs:check-links` if present or provisioned.

2. Generate or restore missing inventory/archive witnesses.
   - `audit/evidence/repo-folder-file-spec-inventory-latest.json`
   - `audit/evidence/repo-cleanup-archive-manifest-latest.json`

3. Produce SIGNAL witness.
   - Required row: `SIGNAL maturity`
   - Expected target: `L5 / 100`

4. Create Agile production-package artifacts.
   - Standardized machine record.
   - Forensic spec.
   - Package MPR.
   - Package SIGNAL.
   - Feature/spec package manifest.

5. Resolve root hygiene after preserving required files.
   - Current forbidden roots include dotfiles, `documents`, `reports`,
     `sessions`, and `tests`.
   - Do not delete or move until inventory and archive recoverability are
     established.

## Verification path

Run from `fabric-os` after ledger-ui remediates:

```bash
pnpm qasc:repo -- --repo ledger-ui --json
pnpm qasc:fleet -- --repos ledger-ui --json
```

Target:

```text
ledger-ui QASC 100/100
Folder/file/product spec alignment 100/100
SIGNAL L5 / 100
Production package controls 100/100
```

## Boundary

fabric-os itself remains at `97/100` only because this fabric-os worktree has a
concurrent deployment evidence modification:

```text
M audit/evidence/codebuild-deploy-start-latest.json
```

That is not a ledger-ui blocker and must not be remediated by ledger-ui.
