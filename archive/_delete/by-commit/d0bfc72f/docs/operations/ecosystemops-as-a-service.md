---
title: 'EcosystemOps as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'ecosystemops', 'fabric']
review_cycle: on-change
---

# EcosystemOps as a Service

Fabric OS participates in EcosystemOps by validating network substrate,
coordination registers, and cross-repo operational readiness. Bridge OS owns the
program-office registries; Ecosystem OS owns public ecosystem publishing.

## System of Record

| Artifact                 | Path                                                    | Role                    |
| ------------------------ | ------------------------------------------------------- | ----------------------- |
| Network check            | `platform/scripts/ecosystemops-network-check.mjs`       | Local EcosystemOps gate |
| Bridge network registry  | `bridge-os/pm/spec/ecosystemops-network-registry.json`  | Program network SoR     |
| Bridge friction register | `bridge-os/pm/spec/ecosystemops-friction-register.json` | Program friction SoR    |
| Latest witness           | `audit/evidence/ecosystemops-network-check-latest.json` | Local network witness   |

## Commands

```bash
pnpm ecosystemops:network:check
pnpm ecosystemops:network:check:write
```

## Rules

- Fabric OS validates substrate and writes local evidence.
- Bridge OS owns fleet coordination registry state.
- Ecosystem OS owns public-facing ecosystem publication.
