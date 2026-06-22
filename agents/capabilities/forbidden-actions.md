---
title: 'forbidden-actions'
status: current
date: 2026-06-22
owner: fabric-os
document_type: onboarding
tier: critical
tags: ['documentation', 'agents']
review_cycle: on-change
---

# Forbidden actions — fabric-os

- Commit secrets, `.env`, vault exports, or raw credentials in evidence
- Force-push to `main` or skip husky hooks without Class S operator override
- Cross-repo product implementation without owner-repo workspace switch (Protocol 24)
- Fork canon layer JSON or fleet persona bodies under `agents/`
- Duplicate `operations/` machine domains under `docs/operations/agents/`
