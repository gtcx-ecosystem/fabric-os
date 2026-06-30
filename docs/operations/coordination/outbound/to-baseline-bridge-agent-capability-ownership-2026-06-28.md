---
title: 'Outbound — move agent-capability ownership (skills / cursor rules / personas) to baseline-os'
status: sent
date: 2026-06-28
from: fabric-os
to: [baseline-os, bridge-os]
ticket: XR-AGENT-CAPABILITY-OWNERSHIP-001
authorityClass: A
protocol: P24
blocksIR: false
owner: [baseline-os, bridge-os]
document_type: runbook
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# To baseline-os + bridge-os — agent capabilities belong in the AI OS, not the coordination engine

**One-line read:** agent **skills, cursor rules, and personas** are AI-OS content, but they are
currently **sourced + distributed from bridge-os**. baseline-os _is_ the AI operating system /
studio ("Rails for AI") — it should **own + distribute** these capabilities. The current
placement causes per-repo duplication, dangling-symlink "rename breaks," and unwired producers.

## The finding (surfaced during the fabric-os symlink de-debt)

- `bridge-os/platform/scripts/ecosystem/rollout-skills-bridge.mjs` distributes `.cursor/rules`
  (skill-\*.mdc) + `.claude/skills/<dir>` from **bridge-os** to every repo.
- `bridge-os/platform/scripts/ecosystem/rollout-agent-conduct.mjs` distributes the `agent-*` /
  `protocol-*` cursor rules from **bridge-os**.
- `bridge-os/platform/scripts/agent/persona-read-witness.mjs` (persona producer) lives in **bridge-os**.

bridge-os is the audit/coordination engine. Agent capabilities (how agents think, the skills they
load, the personas they adopt) are **AI-OS concerns** = baseline-os's domain.

## Symptoms this placement caused (already remediated by fabric-os, non-destructively)

- **425 tracked `.cursor/rules` symlinks → bridge-os** across 20 repos (now converted to copies;
  git fragility / "beyond symbolic link" errors).
- **Dangling symlinks** pointing at the pre-rename `bridgeOS/` path (the "renaming breaks" failure)
  in 5 repos — 75 broken skill rules.
- **Per-repo duplication** is the wrong fix for `.claude/skills` (directories) — the duplication
  smell is the symptom of the wrong owner.
- **Persona producer unwired** in ledger-ui / compliance-os / terra-os / exploration-os →
  recurring `GATE-PERSONA-READ` blocks.

## Requested

**baseline-os** (new owner):

1. Own the canonical agent-capability set: skills, cursor rules (skill-_/agent-_/protocol-\*), personas.
2. Provide the distribution mechanism as the AI OS (serve/sync — copies, not symlinks; dir-safe;
   self-healing on rename). fabric-os already made the rollout copy + dir-safe + dangling-safe
   (bridge-os PRs #43/#44/#45) — that logic should move with the ownership.
3. Own the persona producer (`persona:read-witness`) + wire it fleet-wide so `GATE-PERSONA-READ`
   stops false-blocking.

**bridge-os** (relinquish):

1. Hand the three rollout/producer scripts to baseline-os; keep only audit/coordination concerns.
2. Sequence with `XR-BRIDGE-FEAT-SYNC-001` (feat→main) so the live tooling carries the moved producers.

## fabric-os position

- Symlink de-debt **complete** (0 tracked `.cursor/rules` symlinks; producers made copy/dir/dangling-safe).
- This is an **ownership move**, not a bug — `blocksIR: false`. fabric-os does not own agent capabilities;
  surfacing the mis-placement for the two owners to resolve.

## Related

- `XR-BRIDGE-FEAT-SYNC-001` (bridge-os feat→main — activates the copy-based rollout live)
- Separately filed: the audit flow needs an explicit **handoff** artifact (directive "what's next" to a
  repo), distinct from assessment/remediation — fabric-os will draft that in its own lane.
