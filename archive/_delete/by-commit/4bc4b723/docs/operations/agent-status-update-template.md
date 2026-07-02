---
title: 'Agent Status Update — template (Protocol 26 §3b + P45 v3)'
status: current
date: 2026-06-22
owner: baseline-os
tier: standard
tags: [['agents', 'protocol-26', 'protocol-45', 'communication']]
review_cycle: on-change
document_type: runbook
role: protocol-architect
document_id: OPS-AGENT-STATUS-UPDATE
---

# Agent Status Update — template

**Message type:** `STATUS_UPDATE` · **When:** end of substantive turn, handoff, sprint boundary.

Complements **Proceed Brief** (`agent-proceed-brief-template.md`) at session start.

| When                                              | Use                               |
| ------------------------------------------------- | --------------------------------- |
| Session start, new story, blocker cleared         | **Proceed Brief**                 |
| After executing work, mid-session report, handoff | **Status Update** (this template) |

Spec: `machine/spec/agent-communication-protocol.json` (P45) · UX: `machine/spec/agent-communication-ux-spec.json`

---

## Template

```markdown
## Status Update

### Execution mode

- **Mode:** <auto-dev mode id> · **Scope:** <program / sprint / roadmap>
- **Progress:** <from `pnpm agent:next-work --json` → execution + progress>

### Done

- <what shipped or verified> — `<command>` exit <code> · commit `<sha>` · probe: <fact>

### Next work item

- **Type:** Story | Epic | Task | Sprint | Milestone
- **ID:** `<story-id>`
- **Title:** <story title>
- **Owner:** <repo | role>
- **Value created:** <product/program outcome — from product-goals / GTM>
- **Scope:** <own-in-scope | own-handoff | other-our-scope | other-their-scope> — <label>

### Parallel sovereign gates

- **Class {A|S}** · `{gate-id}` · **Why:** <why agent cannot assign/act> · **Unblock:** <named role + artifact path> · **blocksIR:** false · **Does not block:** `{active-story-id}`

### Approval needed

- **Class {A|S}** · `{gate-id}` · **Why:** <why the agent cannot execute> · **Unblock:** <human/external action> · **blocksIR:** true
```

---

## Section rules

### Execution mode

- From `pnpm agent:next-work --json` → `execution` and `progress`.
- One headline line the operator can scan: mode + % complete.

### Done

- Past tense, evidence-linked (exit codes, SHAs, probe results). See `agent-communication-ux-spec.json` evidenceLineFormat.

### Next work item

- **Exactly one** agile artifact — Type + ID + Title + Owner + **Value created** + **Scope**.
- Legacy **Next priority** and **Because** on this section are forbidden (P45 v3 / ACOM-WI-001).

### Parallel sovereign gates (`blocksIR: false`)

- Human gates that do not block the active story (`human-gate-navigation.md`).
- Required: Class · gate-id · **Why** · **Unblock** · **blocksIR:** false · **Does not block:** story ID.
- Omit when empty. Spec: `bridge-os/pm/spec/approval-clarity-protocol.json`.

### Approval needed (`blocksIR: true` or Class A custody)

- Class A/S only when the gate blocks the active story.
- Omit when empty. Message **ends** after the last non-empty section.

---

## Anti-patterns

| Wrong                                  | Right                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `### Next priority`                    | `### Next work item`                                                              |
| `- **Because:**` on Next work item     | `- **Value created:**` + `- **Scope:**`                                           |
| `blocksIR:false` under Approval needed | Parallel sovereign gates + Does not block                                         |
| End with "want me to …"                | Execute Class R; terminal section                                                 |
| "if you want" / opt-in closings        | Product lead directive — `bridge-os/pm/spec/product-lead-directive-protocol.json` |

---

_Normative: [Protocol 45](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/protocols/45-agent-communication/protocol.md) · UX spec: `machine/spec/agent-communication-ux-spec.json`_
