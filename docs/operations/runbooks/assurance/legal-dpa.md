---
title: 'Legal DPA tracking'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['assurance', 'legal', 'dpa']
review_cycle: quarterly
---

# Legal DPA tracking

Data processing agreements are Class S legal gates. fabric-os tracks them but does not countersign.

## System of Record

- `operations/legal/manifest.json`
- `operations/legal/gates.json`
- `docs/operations/runbooks/legalops-as-a-service.md`

## Status

No DPAs countersigned in this repo. Open gate tracked in `operations/attestation/gates.local.json` (LEGAL-DPA-001).

## Authority

Class S — agent stops; legal team executes.
