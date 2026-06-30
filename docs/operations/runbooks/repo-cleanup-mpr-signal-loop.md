---
title: 'Repo cleanup MPR/SIGNAL loop'
status: current
date: 2026-06-30
owner: fabric-os
document_type: runbook
tier: critical
authority: fabric-os AaaS/DaaS assurance lane; canon-os governance and folder/file specs
version: 1.0.0
review_cycle: on-change
supersedes: ad hoc repo hygiene cleanup checklists
---

# Repo cleanup MPR/SIGNAL loop

This runbook is the provider-neutral repo cleanup acceptance contract for
`canon-os`, `bridge-os`, `fabric-os`, `agile-os`, `baseline-os`, and product
repos. Any terminal-capable agent can run it: Claude, Codex, Gemini, Kimi,
Cursor, Copilot, or a future provider.

Cleanup is accepted only at **MPR 100/100** and **SIGNAL L5 / 100** for the
cleanup scope. The loop must preserve critical docs/specs/workflows/contracts,
verify owner and consumer commands, run the Fabric AaaS/DaaS evidence lane where
applicable, and generate a human report plus a machine witness. Anything less is
`incomplete` unless a real Class S/external blocker makes it `blocked`.

## Authority Stack

| Surface                                        | Owner         | Required role                                                           |
| ---------------------------------------------- | ------------- | ----------------------------------------------------------------------- |
| Governance, protocols, folder/file specs       | `canon-os`    | P22, P26, P27, P28, P29, P31, P33, P35, institutional baseline          |
| P22 runtime, persona/frame, MPR/SIGNAL engines | `bridge-os`   | Work selection, fleet metadata, scoring engines                         |
| AaaS, DaaS, deployment/ops assurance           | `fabric-os`   | Independent assurance and report/artifact generation                    |
| Agile workflow                                 | `agile-os`    | Feature registry, sprint authority, ceremonies, DoR/DoD, ship gates     |
| Baseline runtime                               | `baseline-os` | Startup/runtime conventions, command surface, machine/operations layout |
| Product implementation                         | repo owner    | Product-specific docs, code, evidence, and local gates                  |

## Non-Negotiables

1. Do not lose critical documentation, specs, work items, evidence, references,
   workflow records, feature specs, PRDs, goals, milestones, or ops contracts.
2. Do not treat movement, archiving, or symlink removal as acceptance by itself.
3. Do not fake compliance with symlinks or ad hoc local scripts.
4. Do not commit provider-local settings, secrets, caches, or build output.
5. Do not redefine owner contracts in consumer repos to hide upstream defects.
6. Do not use `--no-verify` for routine cleanup; if unavoidable, add an exception
   witness and replacement controls.
7. Do not call a repo complete while any deterministic owner or consumer gate
   fails.

## Acceptance Thresholds

| Lens                                 | Required threshold |
| ------------------------------------ | -----------------: |
| MPR cleanup composite                |            100/100 |
| SIGNAL cleanup maturity              |           L5 / 100 |
| MPR Trust & Safety                   |            100/100 |
| MPR Product/Ecosystem Integration    |            100/100 |
| SIGNAL Lossless                      |            100/100 |
| SIGNAL Integrated                    |            100/100 |
| SIGNAL Actionable                    |            100/100 |
| Governance protocol score            |            100/100 |
| Folder/file spec score               |            100/100 |
| AaaS and DaaS gates, when applicable |            100/100 |

## Required Acceptance Table

Every report must include this table. `PASS` is valid only when the row has
evidence and the linked MPR/SIGNAL dimensions score 100 for the cleanup scope.

| Area                          | Result        | Evidence                              | MPR linkage                                     | SIGNAL linkage                   |
| ----------------------------- | ------------- | ------------------------------------- | ----------------------------------------------- | -------------------------------- |
| Worktree clean                | PASS/FAIL     | `git status -sb`                      | Craft, Trust & Safety                           | Grounded                         |
| Critical docs preserved       | PASS/FAIL     | inventory manifest                    | Trust & Safety, Defensive Moat, IP Magic        | Lossless, Specific               |
| Feature/spec registry         | PASS/FAIL     | path + validation                     | Commercial Value, Product/Ecosystem Integration | Specific, Integrated, Actionable |
| Documentation hygiene         | PASS/FAIL     | taxonomy, metadata, link checks       | Compliance, World Class, Trust & Safety         | Navigable, Grounded, Lossless    |
| Roadmap/goals/milestones      | PASS/FAIL     | roadmap, goals, milestone, P22 output | Commercial Value, Agentic Empowerment           | Actionable, Integrated           |
| Agile workflow                | PASS/FAIL/N/A | command output                        | Product/Ecosystem Integration, Craft            | Actionable, Integrated           |
| Ops contract                  | PASS/FAIL/N/A | command output                        | Technical Excellence, Compliance                | Grounded, Integrated             |
| P22/runtime                   | PASS/FAIL/N/A | command output                        | Agentic Empowerment, Compliance                 | Actionable, Specific             |
| Fabric AaaS/DaaS              | PASS/FAIL/N/A | command output                        | Technical Excellence, World Class               | Grounded, Actionable             |
| Foundational micro-audits     | PASS/FAIL     | MPR micro-audit table                 | Foundational MPR tier                           | Specific, Grounded               |
| Transformational micro-audits | PASS/FAIL     | MPR micro-audit table                 | Transformational MPR tier                       | Integrated, Actionable, Lossless |
| Root hygiene                  | PASS/FAIL     | root scan                             | Compliance, Craft                               | Navigable                        |
| Link/reference hygiene        | PASS/FAIL     | scan output                           | World Class, Trust & Safety                     | Navigable, Grounded              |
| Cross-repo contract           | PASS/FAIL     | contract checks                       | Product/Ecosystem Integration                   | Integrated                       |
| Archive recoverability        | PASS/FAIL     | archive manifest                      | Trust & Safety, Defensive Moat                  | Lossless                         |

## Required Artifacts

Every run must generate both artifacts, even for `incomplete` or `blocked`:

```text
audit/reports/repo-cleanup-mpr-signal-acceptance-YYYY-MM-DD.md
audit/evidence/repo-cleanup-mpr-signal-acceptance-latest.json
```

If files are moved or archived, also generate:

```text
audit/evidence/repo-folder-file-spec-inventory-latest.json
audit/evidence/repo-cleanup-archive-manifest-latest.json
```

In `fabric-os`, the executable surface is:

```bash
pnpm repo-cleanup:mpr-signal:acceptance
pnpm repo-cleanup:mpr-signal:acceptance -- --repo <repo>
pnpm repo-cleanup:mpr-signal:acceptance:write
pnpm repo-cleanup:mpr-signal:acceptance:write -- --repo <repo>
```

The command exits `0` only when complete. It exits nonzero for incomplete
evidence and still writes the report/artifact in `:write` mode.

## Loop Phases

The audit is iterative. If any phase fails, record the blocker, remediate the
smallest owner-appropriate issue, regenerate evidence, and restart from Phase 1
for that repo. Re-run consumer phases after any owner-contract change.

| Phase | Gate                                | Required proof                                                                                                                                               |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | Session guard                       | `git status -sb`, `git log --oneline -5`, `pnpm agent:next-work --json`; unrelated dirty work identified and preserved                                       |
| 1     | Pre-cleanup inventory               | Current root scan, critical artifact inventory, proposed disposition                                                                                         |
| 2     | Artifact classification             | Each nontrivial artifact classified as canonical-active, canonical-generated, historical-record, provider-runtime, duplicate-superseded, or delete-forbidden |
| 3     | Documentation taxonomy/lifecycle    | Markdown/JSON/YAML docs have owner, status, version/date where supported, authority, and supersedes mapping                                                  |
| 4     | Feature/spec registry and PRDs      | Feature registry, spec registry, PRDs, acceptance criteria, DoR/DoD, delivery packages, and machine records agree                                            |
| 5     | Roadmap/goals/milestones/workstream | Roadmap, goals, milestones, sessions, status records, and P22 next-work are coherent                                                                         |
| 6     | Foundational micro-audits           | Compliance, Technical Excellence, Craft, World Class, Trust & Safety micro-audits from `machine/spec/aaas-audit-taxonomy.json` are represented               |
| 7     | Transformational micro-audits       | Creativity & Innovation, Commercial Value, Defensive Moat, Agentic Empowerment, Product/Ecosystem Integration, IP Magic micro-audits are represented         |
| 8     | Folder/file specs                   | Canonical roots are used; forbidden live roots are absent unless authorized; no fake symlink compliance                                                      |
| 9     | Preservation/archive proof          | Archive manifest proves recovery path and checksums where practical                                                                                          |
| 10    | Owner workflow validation           | Owner repo gates pass for canon, bridge, fabric, agile, baseline, or the product repo                                                                        |
| 11    | Consumer contract validation        | Consumer repos can run the owner contracts they depend on                                                                                                    |
| 12    | Fabric AaaS/DaaS verification       | AaaS, DaaS, honesty, cadence, friction, and operations gates produce current evidence                                                                        |
| 13    | MPR/SIGNAL scoring                  | Final artifact records MPR 100 and SIGNAL L5 / 100 or names blockers                                                                                         |
| 14    | Remediation loop                    | Blocker owner, command, exit code, evidence, and next remediation are recorded                                                                               |
| 15    | Acceptance/commit/push/handoff      | Micro-commit, no unrelated files swept in, push, clean worktree or documented blocker                                                                        |

## Phase Details

### Inventory And Classification

Inventory these roots before moving anything:

```bash
find . -maxdepth 1 \( -name pm -o -name ops -o -name agentic -o -name reports -o -name .claude -o -name .cursor -o -name .gemini -o -name .kimi \) -print
```

The inventory must include `AGENTS.md`, `agents/`, provider instruction files,
`docs/`, `machine/`, `operations/`, `audit/`, feature/spec registries, agile
workflow docs, goals, milestones, roadmaps, Fabric AaaS/DaaS/deploy docs, and
generated witnesses. Provider-local settings and secrets are delete-forbidden.

### Documentation, Features, Roadmaps

Documentation hygiene covers normative specs, runbooks, generated evidence,
historical records, provider instructions, product docs, feature specs, PRDs,
roadmaps, goals, milestones, workstream records, and status reports. Stale plans
must be archived with supersedes pointers; active duplicate authorities block
World Class, Trust & Safety, Navigable, and Lossless.

Feature/spec acceptance requires path + validation evidence for registries,
PRDs, delivery packages, acceptance criteria, DoR/DoD, tests, and machine
records. Roadmap/goals/milestones acceptance requires current execution state,
P22 mapping, workstream continuity, and archive proof for superseded plans.

### Folder/File Specs

Canonical roots when applicable:

```text
platform/ deploy/ docs/ operations/ audit/ workstream/ agents/ machine/
```

Forbidden live roots unless the canon/repo spec explicitly authorizes them:

```text
pm/ ops/ agentic/ reports/ .claude/ .cursor/ .gemini/ .kimi/
```

Folder/file failures cap Compliance, Craft, Trust & Safety, Navigable, and
Lossless below 100.

### Owner Commands

Run repo-local equivalents where present. Missing owner commands are blockers
when the repo owns that contract; missing consumer-only commands are warnings
only if an equivalent consumer check passes.

```bash
pnpm operations:check
pnpm docs:ia:check
pnpm docs:operations:check
pnpm docs:feature-spec:check
pnpm docs:root-contract:check
pnpm docs:pack:pillar-contract:check
pnpm docs:fractal-mpr:check
pnpm machine:folder:check
pnpm agent:next-work --json
pnpm agent:work-selection:check
pnpm agile:check
pnpm operations:consumption:check
```

Owner-specific required surfaces:

| Repo          | Extra emphasis                                                                     |
| ------------- | ---------------------------------------------------------------------------------- |
| `canon-os`    | Protocols, folder/file specs, institutional baseline                               |
| `bridge-os`   | P22, persona/frame, MPR/SIGNAL engines, no nonexistent repo-local witness commands |
| `fabric-os`   | AaaS, DaaS, assurance, deployment ops, AWS CodeBuild/Argo/EKS docs                 |
| `agile-os`    | Feature/spec registry, ceremonies, sprint authority, ship gates                    |
| `baseline-os` | Startup/runtime command surface, machine/operations conventions                    |

### Fabric AaaS/DaaS Commands

Where applicable, run or capture these:

```bash
pnpm aaas:contract:check
pnpm aaas:audit --lens mpr
pnpm aaas:audit --lens signal
pnpm aaas:audit --lens all
pnpm aaas:signal
pnpm aaas:honesty:check
pnpm aaas:honesty:adversarial
pnpm aaas:honesty:ownership
pnpm aaas:cadence
pnpm aaas:friction:check
pnpm aaas:hygiene:check:strict
pnpm aaas:loop
pnpm daas:cards:check
pnpm daas:friction:check
pnpm daas:fleet:health
pnpm fabric:assurance:run
pnpm fabric:operations:check
pnpm fabric:operations:check:strict
```

Production deploy execution remains AWS-owned through CodeBuild in VPC and Argo
CD in EKS. GitHub is SCM/review only while billing is locked.

## Final Evidence Shape

The machine witness must include:

- `schema: gtcx://fabric-os/repo-cleanup-mpr-signal-acceptance/v1`
- repo, branch, commit, generatedAt, decision.
- loop target/current/blockers/nextRemediation.
- MPR composite, pillars, foundational micro-audits, transformational micro-audits.
- SIGNAL level, score, and dimensions.
- phaseResults for documentation, feature/spec, roadmap/goals/milestones,
  foundational micro-audits, and transformational micro-audits.
- inventory and archive manifest paths.
- acceptanceTable rows matching this runbook.
- commands with command, cwd, exitCode, ownerContract, consumerContract,
  mprPillars, and signalDimensions.

## Exit Rules

| State                                                        | Decision     |
| ------------------------------------------------------------ | ------------ |
| MPR 100 and SIGNAL L5 / 100, no blockers                     | `complete`   |
| Any MPR pillar below 100                                     | `incomplete` |
| Any SIGNAL dimension below L5 / 100                          | `incomplete` |
| Any deterministic owner/consumer gate fails                  | `incomplete` |
| Any critical artifact lacks inventory/archive recovery proof | `incomplete` |
| Class S/external dependency prevents evidence                | `blocked`    |

Do not advance to the next repo until the current repo has a current acceptance
report/artifact or a documented external blocker.

Repo order for systemic cleanup:

```text
canon-os -> bridge-os -> fabric-os -> agile-os -> baseline-os -> product repos
```
