---
title: 'SOC2 evidence program'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['assurance', 'soc2', 'compliance']
review_cycle: quarterly
---

# SOC2 evidence program

## Controls owned

- CC6.1 — Fleet IAM and secrets lifecycle
- CC6.6 — Infrastructure change control and CI gates
- CC7.2 — Security monitoring and IR scaffolding
- CC8.1 — Vendor and supply-chain assurance

## Evidence pipeline

| Control | Artifact                                              |
| ------- | ----------------------------------------------------- |
| CC6.1   | `deploy/terraform/modules/secrets/markets-os.tf`      |
| CC6.6   | `.github/workflows`                                   |
| CC7.2   | `docs/operations/secas/csirt-operating-model.md`      |
| CC8.1   | `audit/evidence/secas-supply-chain-check-latest.json` |

## Open gaps

Tracked in `operations/compliance/gaps.json`:

- COMP-GAP-001 — L3 SIEM ingest and retention
- COMP-GAP-002 — Production pen-test vendor evidence
- COMP-GAP-003 — DPA countersignature register
