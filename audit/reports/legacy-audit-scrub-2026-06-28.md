# Remediation report — Legacy audit scrub

_repo: fabric-os · date: 2026-06-28 · type: report (what was done)_

## What was done

- Archived 24 non-canonical legacy witnesses/reports (composite-audit, docs-hygiene, gtm-_, forensic-_, master-audit, etc.) to audit/archive/legacy-scrub-2026-06-28/ — moved, not deleted (recoverable)
- Canonical AaaS witnesses retained
- contract conformance preserved

## After (current evidence)

- foundation: 92 · composite: 59 · full: 92

## Actions (commits this remediation)

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

- `audit/archive/legacy-scrub-2026-06-28/`

_Non-destructive: superseded artifacts archived under `audit/archive/` (recoverable); all changes in git history._
