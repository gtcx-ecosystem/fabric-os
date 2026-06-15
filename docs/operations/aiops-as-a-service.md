---
title: 'AIOps (agentic reliability substrate)'
status: current
date: 2026-06-15
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
protocol: P49-AIOPS-AS-A-SERVICE
initiative: INIT-GTCX-BRIDGE-AI-ML-OPS
---

# AIOps — fabric-os substrate

**Spec:** `pm/spec/aiops-as-a-service.json`  
**Fleet gate:** bridge-os `pnpm ecosystem:aiops:check:fleet:write`

fabric-os owns anomaly signal registers and agent-tool guard evidence. MLOps remains **baseline-os**.

```bash
pnpm aiops:check:write
```
