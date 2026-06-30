---
title: 'GTCX Quality Assurance, Security, and Compliance Protocol'
status: current
date: 2026-06-30
owner: fabric-os
document_type: assurance-protocol
tier: critical
authority: fabric-os AaaS/DaaS assurance lane; canon-os governance and folder/file specs
version: 2.0.0
review_cycle: on-change
supersedes: ad hoc repo hygiene cleanup checklists
protocol_id: GTCX-QASC-001
workflow_id: qasc-loop
canonical_command: pnpm qasc:repo
tags: [fabric-os, operations]
---

# GTCX Quality Assurance, Security, and Compliance Protocol

| Field             | Value            |
| ----------------- | ---------------- |
| Protocol ID       | `GTCX-QASC-001`  |
| Workflow ID       | `qasc-loop`      |
| Canonical command | `pnpm qasc:repo` |

This protocol defines the provider-neutral quality assurance, security, and
compliance workflow for
`canon-os`, `bridge-os`, `fabric-os`, `agile-os`, `baseline-os`, and product
repos. Any terminal-capable agent can execute it: Claude, Codex, Gemini, Kimi,
Cursor, Copilot, or a future provider.

Repository acceptance is granted only at **MPR 100/100** and
**SIGNAL L5 / 100** for the assessed scope. The workflow preserves critical
docs/specs/workflows/contracts, verifies owner and consumer commands, evaluates
Fabric AaaS/DaaS evidence where applicable, and produces both a human-readable
assurance report and a machine-readable witness. Anything less is `incomplete`
unless a real Class S/external dependency makes it `blocked`.

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
7. Do not call a repo complete while any deterministic owner or consumer gate is
   below benchmark.
8. Do not let Fabric-owned operational lanes block product release. Security,
   pen-test, compliance, legal, GTM, pilot, mobile-store evidence, DR/SLA proof,
   and other operational workflows belong on separate operational roadmaps unless
   the product owner explicitly binds a specific item as a product-release gate.

## Security And Compliance Enforcement

QASC always scores and enforces internal security and compliance implementation.
The repository cannot reach the QASC benchmark unless the MPR Compliance,
Technical Excellence, and Trust & Safety evidence is at 100 with assessable leaf
evidence. A composite score cannot conceal a weak security or compliance pillar.

External assurance is different from implementation compliance. Auditor opinions,
certifications, vendor penetration-test delivery, legal countersignatures, and
elapsed observation periods remain visible, scored, owned, and auditable in the
Fabric assurance lane. They do not block engineering or product release unless an
explicit versioned repo release contract sets `blocksProductRelease: true` for that
exact control. A self-audit never claims an external certification or legal
determination.

Machine contract: `machine/spec/qasc-contract.json`.

## Acceptance Standard

| Lens                                 | Required threshold |
| ------------------------------------ | -----------------: |
| MPR repository assurance composite   |            100/100 |
| SIGNAL repository maturity           |           L5 / 100 |
| MPR Trust & Safety                   |            100/100 |
| MPR Product/Ecosystem Integration    |            100/100 |
| SIGNAL Lossless                      |            100/100 |
| SIGNAL Integrated                    |            100/100 |
| SIGNAL Actionable                    |            100/100 |
| Governance protocol score            |            100/100 |
| Folder/file spec score               |            100/100 |
| AaaS and DaaS gates, when applicable |            100/100 |
| Agile production-package workflow    |            100/100 |

## Agile Production-Package Workflow

QASC audits the current Agile work model, not the retired story-first backlog
model. The required path is:

```text
Feature PRD / Product Goal Brief / Business Milestone Brief
-> standardized machine-readable JSON
-> forensic spec
-> MPR 100/100 + SIGNAL L5 audit
-> production spec package with acceptance criteria, QA, and sprint plans
-> scrum prioritization and sprint planning
```

`machine/backlog.json` is generated compatibility output only. It may support
legacy readers, P22 bridges, or ZenHub adapters, but it is not an authoring
authority, planning authority, or acceptance criterion.

Machine requirements: `machine/spec/qasc-audit-requirements.json`.

## Assurance Control Matrix

Every report must include this table. Each control scores the repository against the
required benchmark for that control.

| Area                          |    Score | Benchmark | Evidence                              | MPR linkage                                     | SIGNAL linkage                   |
| ----------------------------- | -------: | --------: | ------------------------------------- | ----------------------------------------------- | -------------------------------- |
| Worktree clean                | score100 |       100 | `git status -sb`                      | Craft, Trust & Safety                           | Grounded                         |
| Critical docs preserved       | score100 |       100 | inventory manifest                    | Trust & Safety, Defensive Moat, IP Magic        | Lossless, Specific               |
| Feature/spec registry         | score100 |       100 | path + validation                     | Commercial Value, Product/Ecosystem Integration | Specific, Integrated, Actionable |
| Documentation hygiene         | score100 |       100 | taxonomy, metadata, link checks       | Compliance, World Class, Trust & Safety         | Navigable, Grounded, Lossless    |
| Roadmap/goals/milestones      | score100 |       100 | roadmap, goals, milestone, P22 output | Commercial Value, Agentic Empowerment           | Actionable, Integrated           |
| Agile workflow                | score100 |       100 | command output                        | Product/Ecosystem Integration, Craft            | Actionable, Integrated           |
| Ops contract                  | score100 |       100 | command output                        | Technical Excellence, Compliance                | Grounded, Integrated             |
| P22/runtime                   | score100 |       100 | command output                        | Agentic Empowerment, Compliance                 | Actionable, Specific             |
| Fabric AaaS/DaaS              | score100 |       100 | command output                        | Technical Excellence, World Class               | Grounded, Actionable             |
| Security implementation       | score100 |       100 | MPR Technical Excellence + Trust      | Technical Excellence, Trust & Safety            | Grounded, Specific               |
| Compliance implementation     | score100 |       100 | MPR Compliance leaf evidence          | Compliance                                      | Grounded, Specific               |
| Operational lane isolation    | score100 |       100 | scan + contract proof                 | Product/Ecosystem Integration, Compliance       | Integrated, Actionable           |
| MPR composite                 | score100 |       100 | `mpr-repo-latest.json`                | All MPR pillars                                 | Grounded, Specific               |
| SIGNAL maturity               | score100 |       100 | `signal-maturity-latest.json`         | Agentic Empowerment, Technical Excellence       | All SIGNAL dimensions            |
| Foundational micro-audits     | score100 |       100 | MPR micro-audit table                 | Foundational MPR tier                           | Specific, Grounded               |
| Transformational micro-audits | score100 |       100 | MPR micro-audit table                 | Transformational MPR tier                       | Integrated, Actionable, Lossless |
| Product-intent source         | score100 |       100 | PRD/goal/milestone source artifact    | Commercial Value, Product/Ecosystem Integration | Specific, Actionable             |
| Machine-readable record       | score100 |       100 | standardized record JSON              | Technical Excellence, Agentic Empowerment       | Grounded, Integrated             |
| Forensic spec                 | score100 |       100 | forensic spec JSON                    | Craft, Trust & Safety                           | Specific, Lossless               |
| Production spec package       | score100 |       100 | package manifest                      | World Class, Product/Ecosystem Integration      | Integrated, Actionable           |
| Scrum handoff                 | score100 |       100 | sprint plan/package handoff           | Commercial Value, Agentic Empowerment           | Actionable, Integrated           |
| Backlog compatibility only    | score100 |       100 | source-of-truth scan                  | Compliance, Trust & Safety                      | Grounded, Lossless               |
| Root hygiene                  | score100 |       100 | root scan                             | Compliance, Craft                               | Navigable                        |
| Link/reference hygiene        | score100 |       100 | scan output                           | World Class, Trust & Safety                     | Navigable, Grounded              |
| Cross-repo contract           | score100 |       100 | contract checks                       | Product/Ecosystem Integration                   | Integrated                       |
| Archive recoverability        | score100 |       100 | archive manifest                      | Trust & Safety, Defensive Moat                  | Lossless                         |

## Evidence Of Record

Every run must generate both artifacts, even for `incomplete` or `blocked`:

```text
audit/reports/qasc-repo-YYYY-MM-DD.md
audit/evidence/qasc-repo-latest.json
```

If files are moved or archived, also generate:

```text
audit/evidence/repo-folder-file-spec-inventory-latest.json
audit/evidence/repo-cleanup-archive-manifest-latest.json
```

In `fabric-os`, the executable surface is:

```bash
pnpm qasc:repo
pnpm qasc:repo -- --repo <repo>
pnpm qasc:repo:write
pnpm qasc:repo:write -- --repo <repo>
pnpm repo-cleanup:archive-manifest
pnpm repo-cleanup:archive-manifest:write
pnpm qasc:score
pnpm qasc:loop -- --max 5 --repo <repo>
pnpm qasc:loop:write -- --max 5 --repo <repo>
pnpm qasc:fleet
pnpm qasc:fleet:write
pnpm qasc:fleet:strict
pnpm qasc:contract:check
```

`qasc:score` prints numeric acceptance score output
from the same witness and exits `0` only when complete.

The command exits `0` only when complete. It exits nonzero for incomplete
evidence and still writes the report/artifact in `:write` mode.

The loop runner records every iteration, all phase scores, the first remediation,
and a deterministic stop reason in:

```text
audit/evidence/qasc-loop-latest.json
```

`benchmark-reached` means every applicable phase reached 100. `stagnant` means
the score, MPR, and SIGNAL values did not move for the configured consecutive
iterations; the agent must execute the named remediation before another loop.
`max-iterations` means progress occurred but the configured run budget ended.
Repetition without score movement is never reported as convergence.

## Assurance Workflow Phases

The assurance workflow is iterative. If any phase misses its benchmark, record the
blocker, remediate the smallest owner-appropriate issue, regenerate evidence,
and restart from Phase 1 for that repo. Re-run consumer phases after any
owner-contract change.

| Phase | Gate                                | Required proof                                                                                                                                               |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | Session guard                       | `git status -sb`, `git log --oneline -5`, `pnpm agent:next-work --json`; unrelated dirty work identified and preserved                                       |
| 1     | Pre-cleanup inventory               | Current root scan, critical artifact inventory, proposed disposition                                                                                         |
| 2     | Artifact classification             | Each nontrivial artifact classified as canonical-active, canonical-generated, historical-record, provider-runtime, duplicate-superseded, or delete-forbidden |
| 3     | Documentation taxonomy/lifecycle    | Markdown/JSON/YAML docs have owner, status, version/date where supported, authority, and supersedes mapping                                                  |
| 4     | Feature/spec registry and PRDs      | Feature registry, spec registry, PRDs, acceptance criteria, DoR/DoD, delivery packages, and machine records agree                                            |
| 5     | Roadmap/goals/milestones/workstream | Roadmap, goals, milestones, sessions, status records, and P22 next-work are coherent                                                                         |
| 5a    | Operational lane isolation          | Security, pen-test, compliance, GTM, pilot, mobile-store, DR/SLA, and legal roadmaps are separate from engineering/product release gates                     |
| 5b    | Agile production-package workflow   | Source artifact, standardized JSON record, forensic spec, MPR 100, SIGNAL L5, production package, and scrum handoff are present or explicitly N/A            |
| 6     | Foundational micro-audits           | Compliance, Technical Excellence, Craft, World Class, Trust & Safety micro-audits from `machine/spec/aaas-audit-taxonomy.json` are represented               |
| 7     | Transformational micro-audits       | Creativity & Innovation, Commercial Value, Defensive Moat, Agentic Empowerment, Product/Ecosystem Integration, IP Magic micro-audits are represented         |
| 8     | Folder/file specs                   | Canonical roots are used; forbidden live roots are absent unless authorized; no fake symlink compliance                                                      |
| 9     | Preservation/archive proof          | Archive manifest proves recovery path and checksums where practical                                                                                          |
| 10    | Owner workflow validation           | Owner repo gates score at benchmark for canon, bridge, fabric, agile, baseline, or the product repo                                                          |
| 11    | Consumer contract validation        | Consumer repos can run the owner contracts they depend on                                                                                                    |
| 12    | Fabric AaaS/DaaS verification       | AaaS, DaaS, honesty, cadence, friction, and operations gates produce current evidence                                                                        |
| 13    | MPR/SIGNAL scoring                  | Final artifact records MPR 100 and SIGNAL L5 / 100 or names blockers                                                                                         |
| 14    | Remediation loop                    | Phase score, benchmark delta, blocker owner, command, exit code, evidence, next remediation, and stop reason are recorded                                    |
| 15    | Acceptance/commit/push/handoff      | Micro-commit, no unrelated files swept in, push, clean worktree or documented blocker                                                                        |

## Phase Controls

### Evidence Inventory And Classification

Inventory these roots before moving anything:

```bash
find . -maxdepth 1 \( -name pm -o -name ops -o -name agentic -o -name reports -o -name .claude -o -name .cursor -o -name .gemini -o -name .kimi \) -print
```

The inventory must include `AGENTS.md`, `agents/`, provider instruction files,
`docs/`, `machine/`, `operations/`, `audit/`, feature/spec registries, agile
workflow docs, goals, milestones, roadmaps, Fabric AaaS/DaaS/deploy docs, and
generated witnesses. Provider-local settings and secrets are delete-forbidden.

### Documentation, Feature, And Roadmap Controls

Documentation hygiene covers normative specs, runbooks, generated evidence,
historical records, provider instructions, product docs, feature specs, PRDs,
roadmaps, goals, milestones, workstream records, and status reports. Stale plans
must be archived with supersedes pointers; active duplicate authorities block
World Class, Trust & Safety, Navigable, and Lossless.

Feature/spec acceptance requires path + validation evidence for registries,
PRDs, delivery packages, acceptance criteria, DoR/DoD, tests, and machine
records. Roadmap/goals/milestones acceptance requires current execution state,
P22 mapping, workstream continuity, and archive proof for superseded plans.

Operational roadmaps are separate from product and engineering roadmaps. Fabric
may provision and audit security, pen-test, compliance, GTM, pilot, mobile-store
evidence, DR/SLA, and legal workflows for every repo, but those workflows must
surface as operational readiness, procurement qualification, or parallel
assurance items. They must not be rendered as `NO SHIP`, `GA BLOCKED`, product
release blockers, or engineering release blockers unless a repo-local product
release contract explicitly sets `blocksProductRelease: true` for that exact
item.

Examples that stay off the product-release critical path by default:

- External pen-test completion.
- SOC 2, ISO, legal, DPA, LOI, or procurement assurance.
- Mobile store evidence used as operational proof.
- DR live failover RPO/RTO evidence.
- SLA observation-period proof.
- GTM, pilot, or reviewer sign-off workflows owned by Fabric or a non-product
  operational function.

### Folder And File Specification Controls

Canonical roots when applicable:

```text
platform/ deploy/ docs/ operations/ audit/ workstream/ agents/ machine/
```

Forbidden live roots unless the canon/repo spec explicitly authorizes them:

```text
pm/ ops/ agentic/ reports/ .claude/ .cursor/ .gemini/ .kimi/
```

Folder/file scores below benchmark cap Compliance, Craft, Trust & Safety, Navigable, and
Lossless below 100.

### Owner And Consumer Command Controls

Run repo-local equivalents where present. Missing owner commands are blockers
when the repo owns that contract; missing consumer-only commands are scored below
benchmark unless an equivalent consumer check reaches benchmark.

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

### Fabric AaaS/DaaS Assurance Controls

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

## Machine Witness Contract

The machine witness must include:

- `schema: gtcx://fabric-os/qasc-repo-score/v1`
- repo, branch, commit, generatedAt, decision.
- loop target/current/blockers/nextRemediation.
- MPR composite, pillars, foundational micro-audits, transformational micro-audits.
- SIGNAL level, score, and dimensions.
- phaseResults for documentation, feature/spec, roadmap/goals/milestones,
  operational lane isolation, MPR composite, SIGNAL maturity, foundational
  micro-audits, and transformational micro-audits.
- inventory and archive manifest paths.
- acceptanceTable rows matching this runbook.
- commands with command, cwd, exitCode, ownerContract, consumerContract,
  mprPillars, and signalDimensions.

## Determination Rules

| State                                                        | Decision     |
| ------------------------------------------------------------ | ------------ |
| MPR 100 and SIGNAL L5 / 100, no blockers                     | `complete`   |
| Any MPR pillar below 100                                     | `incomplete` |
| Any SIGNAL dimension below L5 / 100                          | `incomplete` |
| Any deterministic owner/consumer gate scores below benchmark | `incomplete` |
| Any critical artifact lacks inventory/archive recovery proof | `incomplete` |
| Class S/external dependency prevents evidence                | `blocked`    |

Do not advance to the next repo until the current repo has a current acceptance
report/artifact or a documented external blocker.

Repository sequence for systemic assurance:

```text
canon-os -> bridge-os -> fabric-os -> agile-os -> baseline-os -> product repos
```
