---
title: 'QASC audit requirements - Agile, Fabric, Baseline, Canon, Bridge'
status: current
date: 2026-07-01
owner: fabric-os
document_type: audit-requirements
tier: critical
authority: fabric-os QASC assurance lane; agile-os workflow authority; canon-os governance authority
version: 1.0.0
review_cycle: on-change
protocol_id: GTCX-QASC-001
tags: [qasc, agile, fabric, baseline, canon, bridge, audit]
---

# QASC Audit Requirements

## Purpose

This document defines the QASC audit requirements for the new GTCX work model.
The audit must verify the full production-package workflow, not the retired
story-first backlog model.

Authoritative workflow:

```text
Feature PRD / Product Goal Brief / Business Milestone Brief
-> standardized machine-readable JSON
-> forensic spec
-> MPR 100/100 + SIGNAL L5 audit
-> production spec package with acceptance criteria, QA, and sprint plans
-> scrum prioritization and sprint planning
-> implementation, review, ship, learn witnesses
```

`machine/backlog.json` may exist as generated compatibility output for old tools,
P22 bridges, and ZenHub adapters. It is not an authoring authority or acceptance
criterion.

## Global QASC Requirements

| Requirement                                   | Score target | Evidence                                                                        |
| --------------------------------------------- | -----------: | ------------------------------------------------------------------------------- |
| Source artifact exists in the correct track   |      100/100 | Feature PRD, product goal brief, or milestone brief                             |
| Standardized machine JSON exists              |      100/100 | `machine/{features,product-goals,business-milestones}/<id>/record.json`         |
| Forensic spec exists                          |      100/100 | `machine/{track}/<id>/forensic-spec.json`                                       |
| MPR audit reaches target                      |      100/100 | `machine/{track}/<id>/audits/mpr.json`                                          |
| SIGNAL audit reaches target                   |     L5 / 100 | `machine/{track}/<id>/audits/signal.json`                                       |
| Production spec package exists                |      100/100 | `machine/{track}/<id>/{feature-pack,goal-pack,milestone-pack}/manifest.json`    |
| Acceptance criteria and QA are package-backed |      100/100 | Package manifest + sprint plan                                                  |
| Scrum handoff is traceable                    |      100/100 | `machine/roadmap/sprints/active.json` or delivery sprint-plan equivalent        |
| Backlog is compatibility-only                 |      100/100 | No source-of-truth claims on `machine/backlog.json`                             |
| Operational lanes are isolated                |      100/100 | External assurance is not a product blocker unless `blocksProductRelease: true` |

## Agile-OS Requirements

**Owner role:** Workflow authority for product intent, machine records, MPR/SIGNAL
package audits, production spec packages, sprint plans, delivery, and scrum
handoff.

**Audit requirements:**

| Area                     | Score target | Required evidence                                                                                                    |
| ------------------------ | -----------: | -------------------------------------------------------------------------------------------------------------------- |
| Feature PRD track        |      100/100 | `product/features/*.md` or current-authority equivalent during transition                                            |
| Product goal track       |      100/100 | `product/goals/*.md` or current-authority equivalent                                                                 |
| Business milestone track |      100/100 | `product/milestones/*.md` or current-authority equivalent                                                            |
| Standard records         |      100/100 | `machine/features/*/record.json`, `machine/product-goals/*/record.json`, `machine/business-milestones/*/record.json` |
| Forensic specs           |      100/100 | `forensic-spec.json` for every active package                                                                        |
| MPR package audits       |      100/100 | `audits/mpr.json` score 100 and no open findings                                                                     |
| SIGNAL package audits    |     L5 / 100 | `audits/signal.json` level L5 and no open findings                                                                   |
| Production packages      |      100/100 | `feature-pack`, `goal-pack`, or `milestone-pack` manifests                                                           |
| Scrum handoff            |      100/100 | sprint plans trace to production packages                                                                            |
| Artifact placement       |      100/100 | product/machine/audit/delivery ownership respected                                                                   |

**Commands to verify when available in the active repo:**

```bash
pnpm agile:mpr-workflow:check
pnpm agile:work-loop:check
pnpm feature:production-package:check
pnpm docs:feature-spec:check
pnpm product:compile:check
pnpm artifact:placement:check
```

## Fabric-OS Requirements

**Owner role:** QASC, AaaS, DaaS, deployment, operational assurance, evidence, and
fleet audit orchestration.

**Audit requirements:**

| Area                          | Score target | Required evidence                                                              |
| ----------------------------- | -----------: | ------------------------------------------------------------------------------ |
| QASC protocol contract        |      100/100 | `docs/operations/runbooks/qasc-protocol.md`, `machine/spec/qasc-contract.json` |
| QASC repo score               |      100/100 | `audit/evidence/qasc-repo-latest.json`                                         |
| QASC loop efficacy            |      100/100 | loop evidence improves scores or names remediation                             |
| AaaS contract                 |      100/100 | contract pin, MPR/SIGNAL audit, cadence, honesty, ownership evidence           |
| DaaS/deployment contract      |      100/100 | CodeBuild, Argo CD, EKS, deployment ops contract evidence                      |
| Operational lane isolation    |      100/100 | pen-test/SOC2/legal/mobile-store/DR/SLA stay parallel by default               |
| External assurance boundary   |      100/100 | no product `NO SHIP` claim without explicit `blocksProductRelease: true`       |
| Repo-by-repo rollout evidence |      100/100 | dated report + latest JSON witness per repo                                    |
| Deletion preservation gate    |      100/100 | `archive/_delete` exact recovery and no current bare deletes across QASC fleet |

**Commands to verify when available:**

```bash
pnpm qasc:contract:check
pnpm qasc:repo -- --repo <repo>
pnpm qasc:loop -- --repo <repo> --max 10
pnpm qasc:fleet
pnpm qasc:deletion-preservation:audit:strict
pnpm aaas:contract:check
pnpm aaas:audit --lens all
pnpm aaas:loop
pnpm fabric:assurance:run
pnpm deployment:ops:contract:check
pnpm deployment:ops:test
pnpm operations:check
```

## Baseline-OS Requirements

**Owner role:** Baseline runtime, universal agent session behavior, command
surface, cost router, session records, and machine/operations conventions.

**Audit requirements:**

| Area                               |             Score target | Required evidence                                                           |
| ---------------------------------- | -----------------------: | --------------------------------------------------------------------------- |
| Universal startup/session contract |                  100/100 | `baseline start`, `baseline session`, or repo-local equivalent              |
| Agent command surface              |                  100/100 | `pnpm agent:next-work --json`, session instructions, status update contract |
| Runtime machine contract           |                  100/100 | `machine/manifest.json`, runtime specs, command lookup                      |
| Operations layout                  |                  100/100 | `docs/operations/`, `operations/`, and root allowlist compliance            |
| Cost/router runtime contracts      | 100/100 where applicable | cost-router contract and CostGuard evidence                                 |
| Session evidence                   |                  100/100 | session ledger/open-items/forensic artifacts when the repo owns them        |
| Provider-agnostic LLM behavior     |                  100/100 | Claude/Codex/Gemini/Kimi instructions route through universal baseline      |

**Commands to verify when available:**

```bash
baseline start
baseline session
pnpm agent:next-work -- --json
pnpm agent:work-selection:check
pnpm operations:check
pnpm machine:status
pnpm machine:sync
```

## Canon-OS Requirements

**Owner role:** Governance protocols, institutional baseline, folder/file specs,
feature spec protocol, documentation IA, root hygiene, and authority model.

**Audit requirements:**

| Area                          | Score target | Required evidence                                                   |
| ----------------------------- | -----------: | ------------------------------------------------------------------- |
| Governance protocol authority |      100/100 | P22, P26, P27, P28, P29, P33, P35/P46/P48/P55/P61/P62 as applicable |
| Folder/file specs             |      100/100 | root allowlist, folder specs, docs folder specs, archive rules      |
| Feature spec protocol         |      100/100 | feature spec registry and schema compliance                         |
| Documentation IA              |      100/100 | docs profile, README/INDEX, frontmatter, link/reference hygiene     |
| Institutional baseline        |      100/100 | personas, frames, lexicon, deliverables, conventions                |
| Write boundary                |      100/100 | agents do not write outside authorized repo/workspace roots         |
| Protocol consumption          |      100/100 | product repos link/cite canon specs rather than redefining them     |

**Commands to verify when available:**

```bash
pnpm operations:check
pnpm machine:folder:check
pnpm docs:ia:check
pnpm docs:feature-spec:check
pnpm agent:work-selection:check
```

## Bridge-OS Requirements

**Owner role:** P22 selection/enrichment, MPR and SIGNAL engines, persona/frame
routing, lane separation, cross-repo coordination, and feature/spec adoption
rollups.

**Audit requirements:**

| Area                        | Score target | Required evidence                                                                   |
| --------------------------- | -----------: | ----------------------------------------------------------------------------------- |
| P22 selection contract      |      100/100 | `agent:next-work --json` emits correct owner, persona, frame, and next action       |
| Agile package compatibility |      100/100 | P22 prefers active production-package sprint work over legacy backlog text          |
| Persona read gate           |      100/100 | persona doc path returned; no blocking repo-local witness command unless executable |
| MPR engine                  |      100/100 | repo/package MPR witnesses generated and schema valid                               |
| SIGNAL engine               |     L5 / 100 | SIGNAL witnesses generated and schema valid                                         |
| Lane separation             |      100/100 | engineering, assurance, legal, docs, GTM lanes are not collapsed                    |
| Feature/spec fleet adoption |      100/100 | feature-spec registry adoption witness and rollup                                   |
| Cross-repo handoff evidence |      100/100 | P24 tickets and coordination logs are durable                                       |

**Commands to verify when available:**

```bash
pnpm agent:next-work -- --json
pnpm audit:mpr:repo:run
pnpm audit:signal:repo:run
pnpm ecosystem:feature-spec:completion
pnpm ecosystem:lane:execution:check
pnpm ecosystem:assurance:evaluate
```

## QASC Audit Scoring Additions

Add these scored controls to every repo audit:

| Control                          | Target | Scoring rule                                                                       |
| -------------------------------- | -----: | ---------------------------------------------------------------------------------- |
| Product-intent source            |    100 | Active feature/goal/milestone source exists or N/A is justified                    |
| Machine-readable standardization |    100 | record JSON exists and satisfies owner schema                                      |
| Forensic spec readiness          |    100 | forensic spec exists and references source record                                  |
| Package MPR                      |    100 | MPR score is 100 with no open findings                                             |
| Package SIGNAL                   |    100 | SIGNAL level is L5 with no open findings                                           |
| Production package               |    100 | package manifest includes acceptance criteria, QA, sprint plans, MPR, SIGNAL       |
| Scrum handoff                    |    100 | sprint plan traces to production package                                           |
| Backlog deprecation compliance   |    100 | backlog is generated compatibility only                                            |
| Deletion preservation policy     |    100 | tracked removals have `archive/_delete` exact coverage and no current bare deletes |

The QASC report must keep the existing repository hygiene, security,
compliance, deployment, AaaS/DaaS, and archive recoverability controls. The new
controls are additive and must be visible in the MPR/SIGNAL-linked table.

## Open Implementation Gap

Fabric currently has the QASC scripts and deployment handoff work in progress,
but the QASC scorer must be extended so these Agile production-package controls
are first-class scored rows. Until that extension exists, QASC can document the
new workflow but cannot prove 100/100 against it.
