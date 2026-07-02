# To baseline-os: deletion-preservation handoff

Date: 2026-07-02
From: fabric-os QASC deletion-preservation audit
To: baseline-os owner agent
Status: no deletion-preservation remediation required

## Summary

`baseline-os` now meets the fabric-os deletion-preservation benchmark. The earlier fleet issue has been resolved: the repo has a fleet-valid exact recovery manifest and no current bare deletes.

Do not rerun broad recovery unless new deletion events appear. The remaining owner-agent work is worktree/SCM hygiene: baseline-os has local commits ahead of origin and generated dirty evidence files that need owner review.

## Reproduced audit evidence

Command:

```bash
pnpm qasc:deletion-preservation:audit:strict -- --repos baseline-os,canon-os --since 2026-06-02T00:00:00
```

Relevant output:

```text
QASC deletion preservation fleet score: 100/100
repositories at benchmark: 2/2
historical bare-delete commits: 263
exact recovery gaps: 0
current bare deletes: 0
baseline-os: 100/100 · historical=100/100 · current=100/100 · fabric-os · benchmark reached
```

Manifest:

```text
path: /Users/amanianai/Sites/gtcx-ecosystem/baseline-os/archive/_delete/exact-manifest.json
schema: gtcx://fabric-os/archive-delete-exact-recovery/v1
repo: baseline-os
events: 802
covered: 802
missing: 0
unique deleted paths: 739
generatedAt: 2026-07-02T08:46:46.725Z
```

## Current repo state

Command:

```bash
git -C /Users/amanianai/Sites/gtcx-ecosystem/baseline-os status -sb
```

Observed state:

```text
## main...origin/main [ahead 4]
```

Dirty tracked generated/session surfaces remain, including `.baseline/*`, `audit/evidence/*-latest.json`, and `machine/ci/*-latest.json`.

Local commits ahead of origin:

```text
910a66e0a fix(archive): align exact recovery manifest
b90952331 fix(qasc): prove deletion recovery archive
27cfbccfb docs(fable): correct baseline-os review (rev 2) — Fable=build-harness, rail is ridden
6e0ff9d36 docs(fable): add refreshed FABLE review (2026-07-02)
```

## Acceptance criteria for owner agent

1. Re-run the strict baseline-only audit:

```bash
pnpm --dir ../fabric-os qasc:deletion-preservation:audit:strict -- --repos baseline-os --since 2026-06-02T00:00:00
```

Expected score: `100/100`, `exact recovery gaps: 0`, `current bare deletes: 0`.

2. Review the four local commits and push them if they are intended owner work.
3. Review dirty generated/session files. Commit only if they are intended current witnesses; otherwise leave for the owning workflow to regenerate.
4. Do not create new deletion recovery payloads unless the audit reports new gaps.
