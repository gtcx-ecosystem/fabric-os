---
title: 'pillar-scorecard — agile/'
status: current
date: 2026-06-16
owner: fabric-os
document_type: folder-spec
tier: operating
tags: ['documentation', 'agile']
review_cycle: on-change
---

# Pillar scorecard — `agile/`

Self-assessment against [`../../canon-os/pm/spec/docs-folder-pillar-contract.json`](../../canon-os/pm/spec/docs-folder-pillar-contract.json) and [`../../pm/spec/agile-pack.json`](../../pm/spec/agile-pack.json#pillarContract).

**Composite target:** **85/100** on all eleven pillars at repo audit order.

| Pillar               | Role      | Artifacts                        | Gate                              | Target |
| -------------------- | --------- | -------------------------------- | --------------------------------- | ------ |
| compliance           | primary   | intake.md, zenhub.md             | pnpm agile:check                  | 85     |
| technicalExcellence  | secondary | qa-uat.md, planning.md           | CI gates named                    | 85     |
| craft                | secondary | README, FOLDER-SPEC              | ceremony surface table            | 85     |
| worldClass           | secondary | planning.md, pillar-scorecard.md | prioritization rubric             | 85     |
| trustAndSafety       | secondary | intake.md, cpo.md                | Class A/S escalation              | 85     |
| creativityInnovation | N/A       | —                                | scored in product/architecture    | 85     |
| commercialValue      | primary   | planning.md, intake.md           | milestone + PRD trace             | 85     |
| defensiveMoat        | secondary | zenhub.md, cpo.md                | fleet decision trace via agile-os | 85     |
| agenticEmpowerment   | primary   | intake.md, planning.md           | P22 delegation documented         | 85     |
| ecosystemIntegration | primary   | intake.md, zenhub.md             | ops/pm/manifest binding           | 85     |
| ipMagic              | N/A       | —                                | scored in docs/product/acceptance | 85     |

## CPO loop witness

| Phase      | Artifact                               |
| ---------- | -------------------------------------- |
| OBSERVE    | `intake.md` + fleet signals            |
| ANTICIPATE | `planning.md` prioritization rubric    |
| DECIDE     | P22 / `pnpm agent:next-work`           |
| EXECUTE    | `sprints/current.md` + owner repo      |
| VERIFY     | `qa-uat.md` + audit evidence           |
| LEARN      | `zenhub.md` hygiene + agile-os backlog |
