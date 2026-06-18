---
title: 'Bug bounty policy'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
storyId: SECAS-S5-05
---

# Bug bounty policy

GTCX operates a coordinated vulnerability disclosure program for sovereign pilot and staging surfaces.

## Scope

- `*.gtcx.trade` production and staging hosts under fabric EKS ingress
- PayOps webhook endpoints listed in `pm/payops-substrate-contract.json`
- Out of scope: third-party SaaS dashboards, social engineering, physical access

## Safe harbor

Good-faith security research that follows this policy will not be pursued legally. Do not access customer data, degrade service, or pivot beyond proof-of-concept.

## Reporting

Email **security@gtcx.trade** with reproduction steps, impact, and affected URL. Response SLA: acknowledgment within 2 business days.

## Triage

See `docs/operations/secas/runbooks/bug-bounty-triage.md`. Machine config: `pm/spec/bug-bounty-ops.json`.

## Witness

```bash
pnpm secas:bounty-ops:check:write
```
