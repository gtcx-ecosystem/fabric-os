---
title: 'Agent launch focus — fabric-os'
status: current
date: 2026-06-06
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
document_id: OPS-AGENT-LAUNCH-INFRA
---

# Launch focus — fabric-os

**Hub spec:** [gtcx-core agent-launch-focus.md](https://github.com/gtcx-ecosystem/gtcx-core/blob/main/01-docs/04-ops/agent-launch-focus.md)

**Config:** `.baseline/launch-focus.config.json` · **State:** `.baseline/launch-focus.json`

**North star:** Live pilot substrate (Wire #2, testnet, hub acks) so apps and GTM can close GR-T2 deals.

```bash
pnpm agent:start --json
pnpm agent:next-work
```

**OI-X02** (ER-1-08 infra hub ack) is on the launch implement path when gtcx-core outbound is filed.
