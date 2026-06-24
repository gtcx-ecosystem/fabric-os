---
title: 'Agent Proceed Brief — template (Protocol 26 + P45 v3)'
status: current
date: 2026-06-22
owner: baseline-os
tier: standard
tags: [[agents, protocol-26, protocol-45, communication]]
review_cycle: on-change
document_type: runbook
document_id: OPS-AGENT-PROCEED-BRIEF
---

# Proceed Brief — template

**Message type:** `PROCEED_BRIEF` · **When:** session start, story switch, after `pnpm agent:next-work`

```markdown
## Proceed Brief

**Next:** <single imperative action>
**Story:** `<story-id>` — <title>
**Value created:** <product/program outcome from product-goals.json or GTM>
**Scope:** <scope-id> — <scope label>
**Blocked until:** <none | artifact path>
**Override:** stop | correct: | story ID

**Active persona:** <institutional-id> (MCP: <mcp-id>)
**Frame:** development | regulatory-audit | trading-floor | field-operations
**Authority class (P28):** R | A | S
```

Then **implement** — no menus, no approval to proceed on Class R.

P22 `selection.reason` is internal witness (`p22Reason`) — not operator-facing.

Spec: `machine/spec/agent-communication-protocol.json` · UX: `machine/spec/agent-communication-ux-spec.json` · Parent: Protocol 26.
