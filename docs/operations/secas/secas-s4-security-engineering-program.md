---
title: 'SECAS S4 security engineering program'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'secops', 'security-engineering', 'fabric']
review_cycle: on-change
---

# SECAS S4 security engineering program

SECAS S4 is the Fabric OS security engineering program for internal closure,
supply-chain assurance, vendor-assurance readiness, and fleet-facing security
evidence.

## System of Record

| Artifact             | Path                                                  |
| -------------------- | ----------------------------------------------------- |
| Roadmap              | `pm/secas-roadmap.json`                               |
| Friction register    | `pm/security-friction-register.json`                  |
| Security manifest    | `ops/security/manifest.json`                          |
| Friction witness     | `audit/evidence/secas-friction-check-latest.json`     |
| Supply-chain witness | `audit/evidence/secas-supply-chain-check-latest.json` |

## Commands

```bash
pnpm secas:friction:check
pnpm secas:supply-chain:check
pnpm secas:approval:check
```

## Rules

- Fabric OS owns shared security controls and evidence.
- Vendor reports and auditor letters remain parallel external gates.
- Product repos consume security policy by contract and write local evidence.
