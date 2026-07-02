---
title: 'Outbound - agile-os folder model approval from fabric-os'
owner: fabric-os
status: current
date: 2026-07-02
version: 1.0.0
updated: 2026-07-02
document_type: coordination
tier: operations
tags: [qasc, agile-os, folder-model]
review_cycle: on-change
authority: GTCX-QASC-001
supersedes: docs/operations/coordination/outbound/to-fabric-os-folder-deprecation-validation-2026-06-28.md
---

# Outbound - agile-os folder model approval from fabric-os

Fabric-os acknowledges the agile-os folder deprecation contract for the
Fabric-owned assurance lane.

## Decision

Fabric QASC, AaaS, MPR/SIGNAL, QA evidence, and release-assurance conventions
support the target folder model:

- `delivery/` is the active scrum, release, QA/UAT handoff, shipping, and
  retrospective surface.
- `machine/` is the executable machine authority.
- `audit/` is the evidence and assurance authority.
- `pm/` must not be an active authored planning surface.
- `agile/` must not remain an active delivery authority after fleet cutover; it
  may exist only as pointer-only compatibility or under `archive/_delete/`.

## Fabric Validation

Fabric has a current QASC contract and scorer that consume production-package
workflow evidence from `delivery/feature-packages/**/sprint-plan.json` and
current MPR/SIGNAL witnesses. Fabric also has deletion-preservation enforcement
requiring exact `archive/_delete/<original-path>` recovery for retired tracked
paths.

Validation evidence:

- `pnpm qasc:contract:check`
- `pnpm qasc:test`
- `pnpm qasc:deletion-preservation:audit -- --since 2026-06-02T00:00:00 --json`

Latest observed fleet deletion-preservation audit on 2026-07-02 reported
`100/100`, `20/20` repositories at benchmark, zero exact recovery gaps, and zero
current bare deletes.

## Boundary

This approval covers Fabric-owned assurance and evidence conventions only. It
does not close bridge-os or baseline-os acknowledgements for P22/session,
program-office, ZenHub, or routing consumers.
