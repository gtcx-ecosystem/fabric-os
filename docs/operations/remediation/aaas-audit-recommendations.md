---
title: 'AaaS framework audit recommendations'
status: current
date: 2026-06-28
owner: fabric-os
document_type: remediation
tier: operating
review_cycle: on-change
tags: [fabric-os, operations]
---

# AaaS framework — audit findings & recommendations

_Summary of the audit of the AaaS (MPR + SIGNAL) framework built in fabric-os. Three self-audits plus
one independent audit (a fresh agent with no stake). Full scorecard:
`audit/reports/session-self-audit-2026-06-28.md`._

## Findings (evidence-based)

- **Off-moat:** the work is measurement infrastructure; the org's stated moat is product/UX craft.
  Defensive-moat and commercial-value pillars self-scored ~30.
- **Purpose not yet fulfilled:** 0 handoff-driven remediations. The loop has not produced a fleet
  witness autonomously; all witnesses were manual local runs.
- **Not currently running:** the CI runner cannot execute under the org GitHub Actions billing lock
  (jobs end in ~2s before any step). Externally blocked, not a code issue.
- **Circular self-assessment:** fabric-os self-scored "SIGNAL L5" with a rubric that rewards existence
  of artifacts the repo contains. The adversarial honesty gate quarantined 0 of 30 real verdicts.
- **Activity vs outcome:** ~84 commits, no product/user-facing code changed.

## What was genuinely good

- The self-audits caught real, verifiable defects (an adversarial-gate false positive, a broken test
  export, a wrongly-deleted file). The honesty process was the session's real deliverable.
- All cleanup was non-destructive (recoverable archives, no force operations).
- The libs are clean and tested (~94 tests); the dual-lens idea is defensible.

## Recommendations

1. **Validate value first.** Run one real end-to-end remediation in a product repo
   (`aaas:audit --lens all` → `aaas:handoff` → real fix → `reports/` write-up citing the handoff →
   re-verify) so the framework's output is judged against a real outcome rather than itself.
2. **Make the adversarial gate produce real signal** on aggregate data — judge inflation via
   cross-witness contradiction, not leaf presence.
3. **Consolidate audit paths** — the legacy five-core audit still runs in bridge-os in parallel; one
   live path avoids drift (`XR-RETIRE-FIVE-CORE-001`).
4. **Weight the next effort toward user-facing product work** — the org's stated moat.

## How to run it (reference)

```bash
pnpm aaas:audit --lens mpr|signal|all --repo <X> [--write]
pnpm aaas:handoff --repo <X> [--write]
pnpm aaas:loop --repo <X> [--write]   # audit -> handoff -> honesty -> ownership -> cadence
```
