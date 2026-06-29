---
title: 'Repo provisioning protocol - fabric-os'
status: current
date: 2026-06-18
owner: fabric-os
role: protocol-architect
tier: standard
tags: ['operations', 'repo-provisioning']
review_cycle: on-change
document_type: protocol
related:
  - ./root-allowlist.json
  - https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/protocols/31-ecosystem-root-allowlist/protocol.md
  - https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/protocols/33-ecosystem-repo-governance-spine/protocol.md
---

# Repo provisioning protocol - fabric-os

> **Machine allowlist:** [`root-allowlist.json`](./root-allowlist.json)
> **Normative:** Protocol 31, Protocol 32, and Protocol 33 in `canon-os`.

## Purpose

Keep the repository root a closed workspace with only allowlisted bootstrap files and P35 hubs. Governance docs for repo provisioning live under `docs/operations/repo/`.

## Enforcement

```bash
pnpm check:workspace-root-cleanliness:strict
pnpm operations:check
```

## Human-owned paths

Paths listed in `root-allowlist.json` as human-owned are excluded from automated relocation. Agents must not delete or move them without an explicit owner instruction.
