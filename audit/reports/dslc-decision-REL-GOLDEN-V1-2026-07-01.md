---
title: 'GTCX DSLC release decision — REL-GOLDEN-V1'
status: current
date: 2026-07-01
owner: gtcx-release-management
authority: GTCX-DSLC-001
version: 1.0.0
---

# GTCX DSLC Release Decision — REL-GOLDEN-V1

Decision: **blocked**. Score: **61/100**.

| Lane           | Required |  Score | Controls at benchmark |
| -------------- | -------- | -----: | --------------------: |
| deployment     | yes      | 50/100 |                   4/8 |
| sales          | yes      | 50/100 |                   2/4 |
| legal          | yes      | 25/100 |                   1/4 |
| communications | yes      | 80/100 |                   4/5 |

## QASC

- Score: 100/100
- SIGNAL: L5
- Evidence: `../markets-os/audit/evidence/qasc-repo-latest.json`

## Blockers

- **deployment:** environment-config-migrations — status=pending; evidence=4; approver=missing
- **deployment:** deployment-rollout-rollback — status=pending; evidence=0; approver=missing
- **deployment:** observability-alerting-slo — status=pending; evidence=3; approver=missing
- **deployment:** post-deploy-verification — status=pending; evidence=4; approver=missing
- **sales:** offer-sku-pricing-approval — status=pending; evidence=0; approver=missing
- **sales:** crm-account-opportunity-owner — status=pending; evidence=1; approver=missing
- **legal:** nda-mou-pilot-partnership-agreement — status=blocked; evidence=0; approver=missing
- **legal:** code-of-conduct-policy-incorporation — status=pending; evidence=0; approver=missing
- **legal:** signatory-authority-execution — status=blocked; evidence=0; approver=missing
- **communications:** legal-privacy-ip-claims-review — status=pending; evidence=0; approver=missing
