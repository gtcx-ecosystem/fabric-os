---
title: 'operations/deployment'
status: current
date: 2026-06-16
owner: fabric-os
document_type: runbook
tier: critical
tags: ['documentation', 'operations']
review_cycle: on-change
---

# Deployment

Release and environment narratives — link `deploy/` Terraform and [`deploy/`](../../deploy/).

## Current Agent Entry

Read first:

- [`agent-deployment-ops-instructions-2026-06-30.md`](./agent-deployment-ops-instructions-2026-06-30.md)
- [`agent-deployment-ops-shareable-brief-2026-06-30.md`](./agent-deployment-ops-shareable-brief-2026-06-30.md)
- [`infra-ai-cost-strategy-2026-06-30.md`](./infra-ai-cost-strategy-2026-06-30.md)
- [`github-billing-independent-deploy-handoff-2026-06-30.md`](./github-billing-independent-deploy-handoff-2026-06-30.md)
- [`../runbooks/package-registry-continuity.md`](../runbooks/package-registry-continuity.md)

Current strategy: GitHub remains source control, but production CI/deploy
execution moves to AWS CodeBuild inside the VPC, with Argo CD handling
Kubernetes delivery from inside EKS. Runtime defaults to AWS `af-south-1`; GCP
is limited to the GTCX Intelligence / Bridge Phase 3 ML artifact bridge until
the cloud-placement SoR changes.

Package registry continuity after npm account lockout runs two lanes in
parallel: AWS CodeArtifact for internal CI/build continuity, and a new/recovered
npmjs account for public distribution.

Retained names such as `gtcx-intelligence-sdk` are resource identifiers only
(ECR/Kubernetes/Terraform/dashboard continuity), not repo ownership. The
machine-readable rule is [`machine/spec/retained-resource-identifiers.json`](../../../machine/spec/retained-resource-identifiers.json).
