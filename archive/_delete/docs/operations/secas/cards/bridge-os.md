---
title: 'SECaaS card — bridge-os witness'
status: current
date: 2026-06-14
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
---

# SECaaS card — bridge-os witness

**Lane:** **coordination** · **Role:** ecosystem assurance witness  
**Friction:** `SECAS-S5-01` (fleet risk + active threat registers) · **Protocol:** P42-SECURITY-AS-A-SERVICE

## Stack security actions (fabric-os witness)

1. Acknowledge and index bridge-os security handoffs in `docs/operations/coordination/`
2. Witness P42 SECaaS protocol checks via `pnpm --dir ../bridge-os ecosystem:secas:check`
3. Link fleet risk/threat registers to fabric-os substrate controls (EKS, WAF, secrets)
4. Include bridge-os threat models in SOC L3 planning where fabric-os is operator
5. Route bridge-os security blockers per Protocol 24 inbound/outbound templates

## Product handoff

Assurance contract or protocol change → `to-bridge-os-*.md`

## Re-probe

```bash
pnpm --dir ../bridge-os ecosystem:secas:check:write
```
