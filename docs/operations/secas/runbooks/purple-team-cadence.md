---
title: 'Purple team quarterly cadence'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
opsLane: SecOps
storyId: SECAS-S5-01
---

# Purple team quarterly cadence

Internal purple-team exercises complement external pen-test (`BG-10-10`). Schedule is machine-readable in `pm/spec/purple-team-cadence.json`.

## Cadence

| Quarter | Window start | Focus                                     |
| ------- | ------------ | ----------------------------------------- |
| Q3 2026 | 2026-09-01   | PayOps webhooks + ESO paths + ingress WAF |

## Witness

```bash
pnpm secas:purple-team:check:write
```

Evidence: `audit/evidence/secas-purple-team-latest.json`
