---
featureId: FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT
initiativeId: INIT-FABRIC-OPS-PRD-ROUTING
title: 'FEAT-FABRIC-QASC-DEPLOYMENT-ROLLOUT — scored production-package audit rollout'
owner: fabric-os
status: active
priority: P0
version: 1.0.0
date: 2026-07-01
updated: 2026-07-01
document_type: prd
tier: product
tags: [fabric-os, qasc, roadmap]
review_cycle: on-change
authority: product-intent
supersedes: repo-cleanup-mpr-signal-loop
---

# Fabric QASC Deployment Rollout

## Problem

Fabric agents need one scored production-package workflow for repository
quality assurance, security, compliance, deployment posture, and operational
handoff. The prior cleanup loop used repo-cleanup language and did not enforce
the Agile production-package chain.

## Intended Outcome

Every repo audit must be driven by QASC and scored against the current Agile
workflow:

1. Feature PRD or product-goal source.
2. Standardized machine-readable record.
3. Forensic spec.
4. MPR package audit.
5. SIGNAL package audit.
6. Production feature/spec pack with acceptance criteria and sprint plan.
7. Scrum handoff for prioritization and delivery planning.

## Non-Goals

- Reintroduce a backlog-first planning model.
- Treat external assurance work as a product-release blocker unless an explicit
  `blocksProductRelease: true` control exists.
- Execute production deployment through GitHub Actions while billing is locked.

## Acceptance Criteria

- QASC contract is versioned and machine-readable.
- QASC repo scoring emits scored rows, not pass/fail-only rows.
- Fabric QASC package artifacts exist under `machine/features/`.
- MPR is recorded at `100/100`.
- SIGNAL is recorded at `L5 / 100`.
- Scrum handoff is machine-readable and references sprint planning.
- Deployment execution remains AWS CodeBuild and Argo CD owned.
