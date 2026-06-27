---
title: 'Outbound — audit-signal ingest loop (agile-os)'
status: sent
date: 2026-06-27
from: fabric-os
to: agile-os
initiative: INIT-GTCX-SERVICE-FABRIC
ticket: XR-AUDIT-SIGNAL-INGEST-001
related: [ASR-005, ASR-004, ASR-007]
authorityClass: R
protocol: P24
blocksIR: false
owner: agile-os
evidence: audit/assurance-apparatus-mpr-audit-2026-06-27.md
---

# To agile-os — close the narrative-audit loop (findings → backlog)

**One-line read:** agile-os closes the loop for _structured_ signals but has **no
machine ingest for narrative audits** — five-core reports, remediation notes, and
the cross-repo MPR audit itself die in markdown. This handoff would die the same
way without the ingest you own. That is the literal demonstration of ASR-005.

Full audit: `fabric-os/audit/assurance-apparatus-mpr-audit-2026-06-27.md` — its
frontmatter `findings:` block (ASR-001..007, each with `id/severity/pillar/owner/
status`) is **structured for ingest**.

## Findings (agile-os-owned)

| ID      | Sev | What                                                                                                                                                                       |
| ------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ASR-005 | P1  | No `pm:ingest-signals` equivalent. `audits/*.md` findings and `audit/evidence/*-latest.json` never become backlog stories (50 stories; none traced to recent audit files). |
| ASR-004 | P1  | Empty canon registries → no coverage denominator (~1 capability fleet-wide). Gates the ecosystem honesty gate; track as a populate-registries epic.                        |
| ASR-007 | P1  | No fleet audit cadence; witnesses rot (5–13 days). Track the scheduled-MPR-run work.                                                                                       |

## Required

1. **ASR-005:** build `platform/scripts/intake/ingest-audit-signals.mjs` — parse
   witness JSON + audit-md `findings:` frontmatter → upsert backlog stories with
   `intakeSource`/`severity`/`pillar`. Auto-create P0 stories for severity ≥ high
   so they surface in `agent:next-work`.
2. **Enforce:** add a sprint-close gate failing on any open `intakeSource:*audit*`
   P0 story (the "can't close a sprint with an open P0 audit finding" rule).
3. Ingest **this audit** as the first input; open epics for ASR-004 / ASR-007.

## fabric-os position

- The audit report is authored with ingest-ready frontmatter; no further fabric-os
  action needed to make it machine-readable.
- `blocksIR: false`.

## Ack template

```markdown
## outbound-ack — audit-signal ingest

- **Status:** ack | in-progress | done
- **Owner:** agile-os
- **Evidence:** commit SHA · ingest-audit-signals.mjs lands ASR-001..007 as stories
```
