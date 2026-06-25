---
title: 'Attestation program'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['assurance', 'attestation', 'evidence']
review_cycle: on-change
---

# Attestation program

fabric-os produces machine-readable attestation evidence for fleet ops, compliance, and security.

## Runners

Defined in `operations/attestation/runners.json`:

- `pnpm fabric:operations:check`
- `pnpm secas:friction:check:write`
- `pnpm secas:csirt:check:write`
- `pnpm aaas:friction:check:write`
- `pnpm daas:cards:check:write`
- MPR repo audit via bridge-os

## Evidence indexes

- `operations/attestation/evidence-index.json` — attestation evidence
- `operations/attestation/witness/evidence-index.json` — audit witness
- `operations/attestation/gates.local.json` — local human gates

## Class S gates

- Legal DPA countersignature
- Vendor pen-test report
