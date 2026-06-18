---
title: 'PayOps fleet substrate migration handoff'
status: current
date: 2026-06-18
owner: fabric-os
document_type: coordination
tier: operating
tags: ['coordination', 'payops', 'fabric']
review_cycle: on-change
---

# PayOps fleet substrate migration handoff

Fabric OS owns the shared PayOps substrate migration from repo-local billing
credentials to central provider paths:

- Flutterwave primary: `gtcx/shared/{env}/payops/flutterwave`
- Stripe secondary: `gtcx/shared/{env}/payops/stripe`

## Evidence

| Artifact          | Path                                                    |
| ----------------- | ------------------------------------------------------- |
| Contract          | `pm/payops-substrate-contract.json`                     |
| Friction register | `pm/payops-friction-register.json`                      |
| Readiness witness | `audit/evidence/payops-substrate-readiness-latest.json` |
| Inventory witness | `audit/evidence/payops-fleet-inventory-latest.json`     |

## Handoff

Product repos consume the Fabric-managed ExternalSecret manifests and route
payment webhooks through the ingress paths listed in
`pm/payops-substrate-contract.json`. Secret population remains Class A and is
not executed by agents without an authorization artifact.
