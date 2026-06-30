---
title: 'DevOps as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'devops', 'infraops', 'fabric']
review_cycle: on-change
---

# DevOps as a Service

Fabric OS owns the DevOps and InfraOps service lane for deployment substrate,
fleet health, staging coordination, and evidence-backed operational readiness.

## System of Record

| Artifact            | Path                                                                         | Role                            |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| Friction register   | `machine/friction-register.json`                                             | DaaS friction and closure state |
| Roadmap             | `machine/daas-roadmap.json`                                                  | Fabric-owned delivery roadmap   |
| Cards check         | `platform/scripts/daas-cards-check.mjs`                                      | Per-repo DaaS card gate         |
| Friction check      | `platform/scripts/daas-friction-check.mjs`                                   | DevOps lane gate                |
| Fleet health        | `platform/tools/scripts/cross-repo-health-probe.mjs`                         | Runtime fleet probe             |
| Latest witness      | `audit/evidence/daas-friction-check-latest.json`                             | Local DaaS witness              |
| Deployment contract | `machine/spec/deployment-ops-contract.json`                                  | CI/CD execution contract        |
| Agent instructions  | `docs/operations/deployment/agent-deployment-ops-instructions-2026-06-30.md` | Agent operating entrypoint      |

## Commands

```bash
pnpm daas:friction:check
pnpm daas:friction:check:write
pnpm daas:cards:check:write
pnpm daas:fleet:health
```

## Rules

- Fabric OS owns deployment choreography and infra readiness evidence.
- Product repos own application behavior and consume Fabric deployment contracts.
- GitHub remains source control only; GitHub Actions is not the production
  CI/deploy control plane while billing is blocked.
- AWS CodeBuild is the default CI executor for production-critical work.
- Argo CD inside EKS is the default Kubernetes delivery path.
- Production EKS API access stays private; agents must use an in-VPC executor
  or in-cluster controller rather than reopening public access.
- Shared secrets, ingress, and environment changes must use Fabric-controlled
  substrate manifests and redacted witnesses.
- Open Class S or Class A gates are reported as parallel gates when
  `blocksIR:false`; they do not freeze routine DevOps work.
