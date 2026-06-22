---
title: 'Security as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'secops', 'security', 'fabric']
review_cycle: on-change
---

# Security as a Service

Fabric OS owns the SecOps lane for shared controls, vendor-assurance evidence,
security friction tracking, and fleet-facing security witnesses.

## System of Record

| Artifact           | Path                                              | Role                               |
| ------------------ | ------------------------------------------------- | ---------------------------------- |
| Security register  | `machine/security-friction-register.json`         | SecOps friction and closure state  |
| Roadmap            | `machine/secas-roadmap.json`                      | Fabric-owned security roadmap      |
| Security manifest  | `operations/security/manifest.json`               | Local security operations manifest |
| Friction check     | `platform/scripts/secas-friction-check.mjs`       | SecOps lane gate                   |
| Approval check     | `platform/scripts/secas-approval-check.mjs`       | Approval witness gate              |
| Supply-chain check | `platform/scripts/secas-supply-chain-check.mjs`   | Supply-chain evidence gate         |
| Latest witness     | `audit/evidence/secas-friction-check-latest.json` | Local SecOps witness               |

## Commands

```bash
pnpm secas:friction:check
pnpm secas:friction:check:write
pnpm secas:approval:check:write
pnpm secas:supply-chain:check:write
```

## Rules

- Security policy and shared controls stay in Fabric-owned Ops artifacts.
- Product repos consume security contracts by pointer and write local evidence.
- Vendor reports, legal countersignatures, and auditor letters are not agent
  executable; they remain parallel gates until authorized artifacts arrive.
- Redacted witnesses are the only committed security evidence unless a spec
  explicitly permits a fuller artifact.
