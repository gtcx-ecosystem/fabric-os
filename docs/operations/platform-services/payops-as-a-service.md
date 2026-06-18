---
title: 'PayOps as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'payops', 'payments', 'fabric']
review_cycle: on-change
---

# PayOps as a Service

Fabric OS owns shared payment substrate custody: provider priority, Secrets
Manager paths, ExternalSecret manifests, webhook ingress contracts, and PayOps
readiness witnesses. Revenue strategy remains RevOps-owned.

## System of Record

| Artifact                 | Path                                                     | Role                                   |
| ------------------------ | -------------------------------------------------------- | -------------------------------------- |
| Substrate contract       | `pm/payops-substrate-contract.json`                      | Provider, secret, and ingress contract |
| Friction register        | `pm/payops-friction-register.json`                       | PayOps friction state                  |
| Provider inventory       | `platform/scripts/payops-providers-check.mjs`            | Fleet provider duplication gate        |
| Readiness check          | `platform/scripts/payops-substrate-readiness.mjs`        | Substrate readiness gate               |
| Populate script          | `platform/scripts/staging/populate-payops-staging-sm.sh` | Class A secret population entry        |
| Latest readiness witness | `audit/evidence/payops-substrate-readiness-latest.json`  | Local readiness witness                |

## Commands

```bash
pnpm payops:providers:check:write
pnpm payops:substrate:readiness:write
```

## Rules

- Flutterwave is the primary Global South payment rail; Stripe is secondary for
  international cards and legacy flows.
- Product repos consume provider credentials through Fabric-managed
  ExternalSecret manifests.
- Agents must not populate live payment secrets without a Class A artifact.
- Open migration rows with `blocksIR:false` remain visible but do not block
  Fabric substrate checks.
