---
title: 'URGENT inbound — markets-os agent D6 git push blocked'
status: open
date: 2026-06-13
owner: fabric-os
from: markets-os
to: fabric-os
ticket: XR-MKT-AGENT-D6-001
protocol: P24
priority: P0
blocksIR: true
severity: urgent
---

# URGENT inbound — XR-MKT-AGENT-D6-001 (agent execution harness)

## Summary

Protocol 27 D6 failure: markets-os agent cannot `git push`. Ecosystem relay `pnpm --dir ../gtcx-agentic ecosystem:git-push` → **ENOENT** (harness repo missing on operator machine).

## Fabric-os action

1. Document or restore fleet **`ecosystem:git-push`** relay path for Cursor agents
2. Evaluate sandbox **git_write** / network policy for Class R settlement
3. Post inbound ack — link any harness fix PR

## Source packet

`markets-os/docs/operations/coordination/to-fleet-agent-sandbox-d6-unblock-2026-06-13.md`

## Related staging evidence (in unpushed batch)

- PNV-4 cluster brokerage deploy + Golden Transaction witness
- K8s manifest: `deploy/kubernetes/staging/brokerage-protocol-trace.yaml`
