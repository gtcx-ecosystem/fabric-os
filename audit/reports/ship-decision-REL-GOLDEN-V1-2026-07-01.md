---
title: 'GTCX SHIP release decision — REL-GOLDEN-V1'
status: current
date: 2026-07-01
owner: gtcx-release-management
authority: GTCX-SHIP-001
version: 1.0.0
---

# GTCX SHIP Release Decision — REL-GOLDEN-V1

Decision: **blocked**. Score: **40/100**.

| Pillar            | Required |  Score | Controls at benchmark |
| ----------------- | -------- | -----: | --------------------: |
| sealed            | yes      | 50/100 |                   2/4 |
| hardened          | yes      | 25/100 |                   1/4 |
| institutionalized | yes      | 75/100 |                   3/4 |
| provisioned       | yes      | 50/100 |                   2/4 |

## DSLC prerequisite

- Release: REL-GOLDEN-V1
- Decision: blocked
- Score: 61/100
- Evidence: `audit/evidence/dslc-release-REL-GOLDEN-V1-latest.json`

## Blockers

- **sealed:** dslc-decision-ready — DSLC blocked; 61/100
- **sealed:** dslc-decision-ready — status=blocked; evidence=1; approver=missing
- **sealed:** release-manager-attestation — status=pending; evidence=0; approver=missing
- **hardened:** legal-ops-critical-controls — status=blocked; evidence=0; approver=missing
- **hardened:** ops-critical-controls — status=pending; evidence=5; approver=missing
- **hardened:** exceptions-risk-acceptance-register — status=pending; evidence=1; approver=missing
- **institutionalized:** billing-payment-revops-standard — status=pending; evidence=0; approver=missing
- **provisioned:** gitbook-public-docs-issued — status=pending; evidence=0; approver=missing
- **provisioned:** public-changelog-release-notes-issued — status=pending; evidence=0; approver=missing
