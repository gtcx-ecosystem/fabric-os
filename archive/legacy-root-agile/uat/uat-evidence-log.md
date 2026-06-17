---
title: 'UAT Evidence Log — fabric-os'
status: current
date: 2026-05-27
owner: fabric-os
tier: standard
tags: [['documentation', 'sprints']]
review_cycle: on-change
document_type: protocol
role: protocol-architect
agent_id: agent://fabric-os/2026-05-27/session-backfill
trust_score: 60
autonomy_level: permissioned
---

# UAT Evidence Log — fabric-os

Tracks user acceptance testing (UAT) evidence for features and sprints. Updated at sprint close and before release.

---

## How to Use This Log

1. Add an entry for each feature or sprint that requires UAT evidence
2. Attach or reference the evidence artifact (test output, screenshot, QA sign-off)
3. Update status when UAT passes
4. This file is checked during release — missing UAT evidence blocks release

---

## Log Format

```markdown
### [YYYY-MM-DD] Sprint N — Feature or Story Name

**Type:** Sprint UAT / Feature UAT / Regression check
**Tested by:** [Role]
**Status:** Pass / Fail / Pending
**Evidence:** [path to artifact or description of evidence]
**Notes:** [any deviations or conditions]
```

---

## Active Log

<!-- Add UAT evidence entries below as sprints close -->

---

## Reference

- [Definition of Done](./definition-of-done.md) — sprint and release DoD
- `baseline-os/01-01-docs/engineering/tasks/cut-release.md` — release workflow that can require this log
