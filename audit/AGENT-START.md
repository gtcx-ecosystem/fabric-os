---
title: 'Audit — Agent Start'
status: current
date: 2026-06-23
owner: fabric-os
role: platform-architect
tier: standard
tags: ['audit', 'agents', 'fabric-os']
review_cycle: on-change
---

# Audit — Agent Start

> **Repo evidence register** — dated reports + machine witnesses only.  
> **Rubric SoR:** [canon-os UNIVERSAL_RUBRIC.md](../canon-os/platform/tools/audit/audit-framework/UNIVERSAL_RUBRIC.md) (`writes: false`).  
> **Save-format SoR:** [canon-os L1-audit.json](../canon-os/machine/spec/repo-provisioning/L1-audit.json).  
> **Five-core registry:** [bridge-os five-core-audits.json](../bridge-os/pm/spec/five-core-audits.json).

---

## Quick start

1. Read the [audit framework README](../canon-os/platform/tools/audit/audit-framework/README.md) and [UNIVERSAL_RUBRIC.md](../canon-os/platform/tools/audit/audit-framework/UNIVERSAL_RUBRIC.md).
2. Run repo gates: `pnpm operations:check` · `pnpm --dir ../bridge-os ecosystem:five-core-audits:check --repo fabric-os`.
3. Execute the audit protocol (§13 of the rubric).
4. Write `audit/<core>-audit-YYYY-MM-DD.md` (five-core registry names only) with witness `audit/evidence/<core>-audit-latest.json`.

Do **not** fork rubric or scoring into this repo — link canon-os / bridge-os SoRs via [`config/canon-os-consumption.json`](../config/canon-os-consumption.json).

---

## Fleet registry entry

Command registry and prompts: [`../gtcx-agentic/audit/AGENT-START.md`](../gtcx-agentic/audit/AGENT-START.md) (execution harness — not standards authority).
