---
title: 'operations/runbooks'
status: current
date: 2026-06-16
owner: fabric-os
document_type: runbook
tier: critical
tags: ['documentation', 'operations']
review_cycle: on-change
---

# Runbooks

Operator runbooks — narrative only; machine bindings in `operations/`.

## Current Runbooks

| Runbook                                                                | Purpose                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`finops-as-a-service.md`](./finops-as-a-service.md)                   | Fabric FinOps lane, including CodeBuild/Argo CD cost posture.               |
| [`github-actions-cost-controls.md`](./github-actions-cost-controls.md) | GitHub Actions guardrails while production CI moves to AWS-owned execution. |
| [`package-registry-continuity.md`](./package-registry-continuity.md)   | Dual-track package continuity: AWS CodeArtifact internal + new npm account. |
