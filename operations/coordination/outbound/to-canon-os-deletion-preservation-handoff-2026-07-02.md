# To canon-os: deletion-preservation handoff

Date: 2026-07-02
From: fabric-os QASC deletion-preservation audit
To: canon-os owner agent
Status: no deletion-preservation remediation required

## Summary

`canon-os` now meets the fabric-os deletion-preservation benchmark. The earlier fleet issue has been resolved: the repo has a fleet-valid exact recovery manifest and no current bare deletes.

Do not rerun broad recovery unless new deletion events appear. The remaining owner-agent work is worktree hygiene on the protocol branch: canon-os has dirty archive files under `archive/_delete/` that need owner review.

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
canon-os: 100/100 · historical=100/100 · current=100/100 · fabric-os · benchmark reached
```

Manifest:

```text
path: /Users/amanianai/Sites/gtcx-ecosystem/canon-os/archive/_delete/exact-manifest.json
schema: gtcx://fabric-os/archive-delete-exact-recovery/v1
repo: canon-os
events: 1884
covered: 1884
missing: 0
unique deleted paths: 1869
generatedAt: 2026-07-02T08:48:26.519Z
```

## Current repo state

Command:

```bash
git -C /Users/amanianai/Sites/gtcx-ecosystem/canon-os status -sb
```

Observed state:

```text
## protocol/62-agent-worktree-isolation...origin/protocol/62-agent-worktree-isolation
 M archive/_delete/docs/agent-provisioning/AGENT-INIT-CANON.md
 M archive/_delete/docs/agents/README.md
 M archive/_delete/docs/agents/provisioning/AGENT-INIT-CANON.md
 M archive/_delete/docs/agile/README.md
 M archive/_delete/docs/coordination/README.md
 M archive/_delete/docs/operations/human-gate-navigation.md
 M archive/_delete/docs/reference/architecture/README.md
 M archive/_delete/exact-manifest.json
?? archive/_delete/by-commit/890f85f1/
?? archive/_delete/by-commit/9d70bd58/
?? archive/_delete/by-commit/b18d2d13/
?? archive/_delete/pm/.__deleted-entry
```

No local-only commits were observed relative to `origin/protocol/62-agent-worktree-isolation`.

## Acceptance criteria for owner agent

1. Re-run the strict canon-only audit:

```bash
pnpm --dir ../fabric-os qasc:deletion-preservation:audit:strict -- --repos canon-os --since 2026-06-02T00:00:00
```

Expected score: `100/100`, `exact recovery gaps: 0`, `current bare deletes: 0`.

2. Review the dirty `archive/_delete/` changes on `protocol/62-agent-worktree-isolation`.
3. If those changes are intended recovery evidence, commit and push them from canon-os.
4. Do not rerun broad recovery unless the strict audit reports new gaps.
