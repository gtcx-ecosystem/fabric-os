---
title: 'GTCX DSLC release decision — REL-FABRIC-DSLC-001'
status: current
date: 2026-07-01
owner: fabric-os platform architecture
authority: GTCX-DSLC-001
version: 1.0.0
---

# GTCX DSLC Release Decision — REL-FABRIC-DSLC-001

Decision: **incomplete**. Score: **32/100**.

| Lane           | Required |   Score | Controls at benchmark |
| -------------- | -------- | ------: | --------------------: |
| deployment     | yes      |  63/100 |                   5/8 |
| sales          | no       | 100/100 |                   0/0 |
| legal          | no       | 100/100 |                   0/0 |
| communications | no       | 100/100 |                   0/0 |

## QASC

- Score: 93/100
- SIGNAL: L5
- Evidence: `pnpm qasc:repo -- --repo fabric-os --json (2026-07-01)`

## Blockers

- **deployment:** qa-qasc-acceptance — QASC 93/100; SIGNAL L5
- **deployment:** qa-qasc-acceptance — status=blocked; evidence=1
- **deployment:** deployment-rollout-rollback — status=pending; evidence=0
- **deployment:** post-deploy-verification — status=pending; evidence=0
