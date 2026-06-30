---
title: 'Fabric agent QASC deployment handoff stories'
status: current
date: 2026-07-01
owner: fabric-os
document_type: handoff
tier: critical
authority: fabric-os QASC and deployment assurance lane
version: 1.0.0
review_cycle: on-change
feature_id: FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT
tags: [qasc, deployment, kimi, agents, codebuild, argocd, assurance]
---

# Fabric agent QASC deployment handoff stories

## Purpose

This packet is the Kimi CLI / Fabric agent handoff for repo-by-repo deployment
readiness, QASC scoring, and evidence generation. It supersedes chat-only
instructions for this workstream and does not use the legacy backlog model.

QASC means **Quality Assurance, Security, and Compliance Protocol**. It is a
Fabric-owned protocol service: every repo is scored, evidenced, remediated, and
audited against the same controls. QASC is not a product-release stop sign by
default. Security, pen-test, compliance, legal, GTM, pilot, mobile-store, DR/SLA,
and certification work stays in Fabric operational roadmaps unless a repo has an
explicit versioned release contract with `blocksProductRelease: true` for the
exact control.

The work authority follows the Agile revamp:

```text
Feature PRD / Product Goal Brief / Business Milestone Brief
-> standardized machine-readable JSON
-> forensic spec
-> MPR 100/100 + SIGNAL L5 audit
-> production spec package with acceptance criteria, QA, and sprint plans
-> scrum prioritization and sprint planning
```

`machine/backlog.json` is generated compatibility output only. It is not the
planning source of truth for this work.

## Agent entry

Run from `fabric-os`:

```bash
pnpm operations:check
pnpm agent:next-work -- --json
pnpm qasc:contract:check
pnpm deployment:ops:contract:check
pnpm deployment:ops:test
```

Kimi agents must use GitHub for SCM/review only. Production execution remains
AWS-owned through CodeBuild in VPC and Argo CD in EKS while GitHub billing is
locked. Do not use GitHub Actions as the production deploy executor.

## Scoring model

There is no pass/fail-only closeout. Each repo receives numeric evidence:

| Area                                | Score target | Evidence                                |
| ----------------------------------- | -----------: | --------------------------------------- |
| QASC repository score               |      100/100 | `audit/evidence/qasc-repo-latest.json`  |
| MPR composite                       |      100/100 | repo MPR witness                        |
| SIGNAL maturity                     |     L5 / 100 | repo SIGNAL witness                     |
| Operational lane isolation          |      100/100 | QASC lane-isolation scan                |
| Deployment domain score             |        10/10 | `audit/deployment-audit-YYYY-MM-DD.md`  |
| Fabric AaaS/DaaS consumer readiness |      100/100 | Fabric commands and repo evidence       |
| Archive recoverability              |      100/100 | inventory and archive manifest          |
| Worktree integrity                  |      100/100 | `git status -sb`, no unrelated sweep-in |

Below-target results are `incomplete` with a named remediation, not a generic
failure. External Class A/S evidence gaps are `blocked` only for that operational
lane, not product release, unless the release contract explicitly binds them.

## Current deployment executor state

Latest source-aligned staging CodeBuild retry:

| Field                       | Value                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Build id                    | `gtcx-staging-deploy-executor:ef0d3176-8d2a-4e31-ade6-aa4d73077bc4`                                                            |
| Source version              | `61ae906cd49047d57a6825edce9f2b322778a6ed`                                                                                     |
| Status                      | `FAILED`                                                                                                                       |
| Failed phase                | `BUILD`                                                                                                                        |
| Immediate cause             | `node platform/scripts/codebuild-deploy-runner.mjs --write --execute` exited 1                                                 |
| Root cause observed in logs | `terraform-plan-summary` captured full `terraform show -json tfplan`, hit `spawnSync terraform ENOBUFS`, and emitted `SIGPIPE` |
| Apply posture               | No apply. Plan summary is not accepted until value-free summary generation is bounded.                                         |

The prior plain plan showed `0 to add, 9 to change, 0 to destroy`, but the
resource list and action summary must be captured deterministically before any
staging apply. Do not proceed to apply from the failed build.

## Stories

### FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT-001: PRD and machine-record intake

**Owner:** `fabric-os`
**Authority:** R
**Track:** feature PRD

**Objective:** Create or update the Fabric feature PRD and standardized machine
record for repo-by-repo QASC/deployment rollout.

**Score targets:**

| Control                                       |  Target |
| --------------------------------------------- | ------: |
| Feature PRD completeness                      | 100/100 |
| Standardized feature JSON completeness        | 100/100 |
| Owner repo and authority classes specified    | 100/100 |
| Acceptance criteria, QA, sprint plans present | 100/100 |

**Verification:**

```bash
pnpm operations:check
pnpm qasc:contract:check
```

### FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT-002: MPR/SIGNAL package audit

**Owner:** `fabric-os`
**Authority:** R

**Objective:** Produce MPR and SIGNAL audit evidence for the QASC/deployment
feature package before scrum handoff.

**Score targets:**

| Control                     |   Target |
| --------------------------- | -------: |
| MPR package score           |  100/100 |
| SIGNAL package maturity     | L5 / 100 |
| Production package manifest |  100/100 |
| Sprint handoff traceability |  100/100 |

**Verification:**

```bash
pnpm qasc:contract:check
pnpm deployment:ops:contract:check
pnpm deployment:ops:test
```

### FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT-003: Fix bounded Terraform plan-summary evidence

**Owner:** `fabric-os`
**Authority:** R
**Depends on:** package audit score at target

**Objective:** Update `platform/scripts/codebuild-deploy-runner.mjs` so
`terraform-plan-summary` never buffers raw full plan JSON. The runner must emit
only a value-free bounded summary: format version, Terraform version, change
count, resource addresses, and action arrays.

**Score targets:**

| Control                                |  Target |
| -------------------------------------- | ------: |
| No raw secret/value leakage in summary | 100/100 |
| No ENOBUFS/SIGPIPE on staging plan     | 100/100 |
| Deployment contract check              | 100/100 |
| Deployment tests                       | 100/100 |

**Verification:**

```bash
pnpm deployment:ops:test
pnpm deployment:ops:contract:check
pnpm deployment:codebuild:start -- --environment=staging --mode=plan --source-version=<pushed-commit> --secret-env=CLOUDFLARE_API_TOKEN=gtcx/staging/cloudflare-dns-api-token --write --execute
```

### FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT-004: Stage bounded CodeBuild plan and evidence review

**Owner:** `fabric-os`
**Authority:** R for plan, A for apply

**Objective:** Run a source-aligned staging plan on the pushed commit and capture
bounded evidence. The review must name every in-place change and confirm there
are no creates or destroys before requesting any Class A apply.

**Score targets:**

| Control                              |  Target |
| ------------------------------------ | ------: |
| Source version matches pushed commit | 100/100 |
| Plan action summary bounded          | 100/100 |
| Create/destroy count acceptable      | 100/100 |
| Evidence written and redacted        | 100/100 |

**Stop condition:** Any create, destroy, raw secret, unbounded output, or source
mismatch returns to the bounded plan-summary remediation.

### FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT-005: Staging apply and Argo reconciliation

**Owner:** `fabric-os`
**Authority:** A

**Objective:** After a bounded reviewed plan and Class A artifact, run staging
apply through CodeBuild, then reconcile Argo CD from the approved Git source.

**Score targets:**

| Control                                   |  Target |
| ----------------------------------------- | ------: |
| CodeBuild apply source alignment          | 100/100 |
| EKS capacity remediated                   | 100/100 |
| Argo `fabric-staging-root` sync/health    | 100/100 |
| PodSecurity seccomp issue remediated live | 100/100 |
| Pending pod pressure reduced              | 100/100 |

**Verification:**

```bash
kubectl get nodes
kubectl get pods -A
kubectl -n argocd get application fabric-staging-root
kubectl apply --dry-run=server -k deploy/kubernetes/overlays/staging -o name
```

### FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT-006: Repo-by-repo QASC rollout

**Owner:** `fabric-os`
**Authority:** R per repo unless owner repo mutation is required

**Objective:** Score and remediate one repo at a time. Do not move to the next
repo until the current repo has either QASC 100/100 + MPR 100/100 + SIGNAL L5
and a valid Agile production-package workflow, or a documented external blocker
with owner and next remediation.

**Order:**

```text
canon-os -> bridge-os -> fabric-os -> agile-os -> baseline-os ->
compliance-os -> ecosystem-os -> exploration-os -> gtcx-os ->
griot-ai -> nyota-ai -> ledger-ui -> ledger-os -> inspection-os ->
markets-os -> terminal-os -> terra-os -> sensei-os -> venture-os -> veritas-ai
```

`inspection-os` is the actual repo name for the previously referenced
`inspector-os`.

**Per-repo loop:**

```bash
pnpm qasc:repo -- --repo <repo> --json
pnpm qasc:loop -- --repo <repo> --max 10 --json
pnpm qasc:repo:write -- --repo <repo>
```

**Score targets:**

| Control                                             |                   Target |
| --------------------------------------------------- | -----------------------: |
| QASC repository score                               |                  100/100 |
| MPR composite                                       |                  100/100 |
| SIGNAL maturity                                     |                 L5 / 100 |
| Folder/file spec                                    |                  100/100 |
| Docs/feature/agile/ops evidence                     |                  100/100 |
| PRD -> JSON -> MPR/SIGNAL -> package -> scrum trace |                  100/100 |
| AaaS/DaaS consumer readiness                        | 100/100 where applicable |

**Rule:** Product repos consume Fabric QASC/AaaS contracts. They do not need to
duplicate Fabric engines or invent local scripts to satisfy bad emissions.

### FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT-007: Operational roadmap isolation remediation

**Owner:** `fabric-os` with repo owners
**Authority:** R, except external Class A/S artifacts

**Objective:** Remove accidental `NO SHIP`, `GA BLOCKED`, or release-blocking
language caused only by Fabric-owned operational lanes. Reclassify such items as
operational readiness, procurement qualification, or parallel assurance evidence
unless the repo release contract explicitly sets `blocksProductRelease: true`.

**Controls that stay parallel by default:**

```text
external pen-test, SOC2/ISO, legal countersignature, mobile store evidence,
DR live failover RPO/RTO, SLA observation period, GTM/pilot/reviewer sign-off
```

**Score targets:**

| Control                           |  Target |
| --------------------------------- | ------: |
| Operational lane isolation        | 100/100 |
| Product release language accuracy | 100/100 |
| External assurance visibility     | 100/100 |
| No false product blockers         | 100/100 |

### FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT-008: Fleet report and next-agent handoff

**Owner:** `fabric-os`
**Authority:** R

**Objective:** After each repo wave, generate one human report and one
machine-readable artifact that another agent can resume without chat context.

**Evidence:**

```text
audit/reports/qasc-fleet-YYYY-MM-DD.md
audit/evidence/qasc-fleet-latest.json
workstream/sessions/handoffs/<dated-handoff>.md
```

**Score targets:**

| Control                    |  Target |
| -------------------------- | ------: |
| Fleet denominator accuracy | 100/100 |
| Repo status resumability   | 100/100 |
| Open blocker ownership     | 100/100 |
| No chat-only state         | 100/100 |

## Kimi CLI operating rules

1. Start in `fabric-os`; use `pnpm agent:next-work -- --json`.
2. Work one repo at a time in the order above.
3. Use score deltas, not pass/fail prose, to decide whether the loop improved.
4. Do not use `--write` commands in sibling repos unless the repo is the active
   owner for that story and the mutation is intended.
5. Do not use GitHub Actions for production deployment execution.
6. Do not run Terraform apply or production Argo sync without Class A evidence.
7. Do not hide external assurance gaps; classify them as parallel lane blockers.
8. Do not create repo-local scripts to satisfy a bad Fabric or Bridge contract.
9. Commit micro-changes with exact staging; do not sweep unrelated dirty files.
10. End every repo with a dated report, latest JSON witness, and clean or
    explicitly documented worktree state.
