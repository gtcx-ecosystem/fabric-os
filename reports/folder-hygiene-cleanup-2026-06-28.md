# Remediation report — Folder hygiene cleanup to spec

_repo: fabric-os · date: 2026-06-28 · type: report (what was done)_

## What was done

- Relocated docs/agile/roadmap.md -> agile/roadmaps/
- Moved docs/strategy/ bodies -> docs/business/strategy/
- Relocated architecture sprawl (honesty-gate-design -> specs/, glm-assessment -> narratives/)
- Relocated agile/roadmap-bridge.md -> agile/roadmaps/
- Archived stale dup agents/pillar-scorecard.md (superseded by scorecard.md)
- Removed emptied legacy dirs docs/agile, docs/strategy
- Folder hygiene 11/16 -> 16/16

## After (current evidence)

- foundation: 92 · full 11-pillar: 92

## Actions (commits this remediation)

- `299d7c49 feat(aaas): fleet hygiene/closed-specs enforcement (AaaS-lane lock-in)`
- `3e4da84e docs(report): AaaS fleet remediation report (orchestrator record)`
- `0564b352 chore(aaas): archive legacy witnesses to legacy-scrub (front 1)`
- `22d94820 chore(aaas): refresh fabric-os MPR + honesty witnesses (cadence run)`
- `fbda4918 feat(aaas): contract provisioner + fabric-os pin (folders + thin pin)`
- `540b91a5 chore(audit): archive dated audit-report siblings to audit/archive`
- `1de1c42d chore(audit): refresh evidence witnesses; archive dated audit-report siblings`
- `37a9e463 feat(aaas): add nightly cadence heartbeat with witness-freshness gate (AAAS-S3)`
- `718e4322 docs(audit): cross-repo assurance-apparatus MPR audit`
- `5ed0f90f fix(aaas): honesty gate now detects hollow composites (laundered scores)`

## Evidence (proof — verifies this report)

- `audit/archive/hygiene-2026-06-28/`
- `audit/evidence/aaas-hygiene-check-latest.json`

_Non-destructive: superseded artifacts archived under `audit/archive/` (recoverable); all changes in git history._
