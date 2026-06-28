# Remediation report — AaaS fleet remediation (standardize + scrub + producer retirement)

_repo: fabric-os · date: 2026-06-28 · type: report (what was done)_

## What was done

- Built AaaS: taxonomy(11 pillars) + contract + command surface + tooling (registry/contract-check/cadence/honesty/provision/scrub/audit/report)
- Provisioned audit+reports folders + contract pin in 20/20 repos
- Scrubbed 571 legacy witnesses/reports → audit/archive/legacy-scrub-2026-06-28/ (move, not delete)
- Retired producers on main via 6 PRs: bridge-os #34/#35/#36/#37, canon-os #15, ledger-os #1
- Regenerated agent files to canonical AaaS surface fleet-wide (0 legacy menus left)
- Applied 69-cluster MPR recipe to agile-os/ledger-os/inspection-os (foundation +25/+54/+59)

## After (current evidence)

- foundation: 92 · composite: 59 · full: 92

## Actions (commits this remediation)

- `0564b352 chore(aaas): archive legacy witnesses to legacy-scrub (front 1)`
- `22d94820 chore(aaas): refresh fabric-os MPR + honesty witnesses (cadence run)`
- `fbda4918 feat(aaas): contract provisioner + fabric-os pin (folders + thin pin)`
- `540b91a5 chore(audit): archive dated audit-report siblings to audit/archive`
- `1de1c42d chore(audit): refresh evidence witnesses; archive dated audit-report siblings`
- `37a9e463 feat(aaas): add nightly cadence heartbeat with witness-freshness gate (AAAS-S3)`
- `718e4322 docs(audit): cross-repo assurance-apparatus MPR audit`
- `5ed0f90f fix(aaas): honesty gate now detects hollow composites (laundered scores)`

## Evidence (proof — verifies this report)

- `machine/spec/aaas-audit-taxonomy.json`
- `machine/spec/aaas-audit-contract.json`
- `machine/spec/aaas-command-surface.json`
- `machine/fleet-audit-registry.json`
- `audit/archive/legacy-scrub-2026-06-28/`

_Non-destructive: superseded artifacts archived under `audit/archive/` (recoverable); all changes in git history._
