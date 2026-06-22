---
title: Cursor — fabric-os
status: current
date: 2026-06-22
owner: fabric-os
document_type: bridge
---

# Cursor — fabric-os

| Resource            | Path                                                           |
| ------------------- | -------------------------------------------------------------- |
| **Canonical entry** | [`AGENTS.md`](../../../AGENTS.md)                              |
| Rules               | [`.cursor/rules/`](../../../.cursor/rules/)                    |
| CLI config          | [`.cursor/cli.json`](../../../.cursor/cli.json) (when present) |

Cursor reads **`AGENTS.md`** at repo root. Synced blocks come from [`.agent/`](../../../.agent/) via `pnpm agent:sync`.

**Workspace:** [`operations/`](../../operations/) · **Protocols:** [`docs/agents/universal/`](../universal/)
