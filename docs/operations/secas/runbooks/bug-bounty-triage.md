---
title: 'Bug bounty triage runbook'
status: current
date: 2026-06-15
owner: fabric-os
storyId: SECAS-S5-05
---

# Bug bounty triage

1. Intake via security@gtcx.trade — tag `bounty-intake`.
2. Classify severity (P0–P3) within 24h.
3. Route to owning repo per `bridge-os/pm/spec/fleet-risk-register.json`.
4. Record finding in fleet threat register when confirmed.
5. Close loop with reporter per policy safe-harbor terms.

Witness: `pnpm secas:bounty-ops:check:write`
