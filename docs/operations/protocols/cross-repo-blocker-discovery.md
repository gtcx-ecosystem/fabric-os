---
title: 'Cross-repo blocker discovery protocol'
status: current
date: 2026-06-25
owner: fabric-os
document_type: protocol
tier: operating
tags: ['operations', 'coordination', 'protocol', 'P24', 'blockers']
review_cycle: quarterly
---

# Cross-repo blocker discovery protocol

## Purpose

Prevent sibling-repo agents from reporting stories as hard-blocked when the owning repo has already delivered Class R infrastructure and only Class A/S gates remain.

## Scope

Applies to any repo whose `agent:next-work` surface includes blockers owned by another repo (e.g., markets-os `IR-006` blocked on fabric-os `PROD-READY-005`).

## Sources of truth

| Source                         | Path                                                                           | Format   | Use                             |
| ------------------------------ | ------------------------------------------------------------------------------ | -------- | ------------------------------- |
| Fleet blocker state (machine)  | `fabric-os/operations/coordination/fleet-blocker-state.json`                   | JSON     | Canonical blocker metadata      |
| Fleet unblock register (human) | `fabric-os/docs/operations/coordination/fabric-os-fleet-unblock-register-*.md` | Markdown | Narrative + history             |
| Hub witness                    | `bridge-os/pm/ci/fabric-os-blocker-<id>-latest.json`                           | JSON     | Redacted readiness signal       |
| Verification command           | Per-blocker, in JSON state                                                     | Shell    | Concrete check any repo can run |

## Rule

Before a repo declares a cross-repo blocker as `blocked`, its agent must:

1. Read `fabric-os/operations/coordination/fleet-blocker-state.json`.
2. Find the blocker matching its story.
3. If `infrastructureReady: true` and a Class A/S step remains, classify the blocker as `awaiting_operator_action` / `parallel`, NOT `blocked`.
4. Optionally run the `verificationCommand` to refresh the signal.

## State machine

```text
blocked_story ──► check fabric-os fleet-blocker-state.json
                    │
                    ├─ infrastructureReady: false ──► blocked (Class R engineering pending)
                    │
                    ├─ infrastructureReady: true, class: A/S ──► awaiting_operator_action (parallel)
                    │
                    └─ infrastructureReady: true, class: R, status: done ──► unblock
```

## Responsibilities

| Repo          | Responsibility                                                                            |
| ------------- | ----------------------------------------------------------------------------------------- |
| fabric-os     | Maintain `fleet-blocker-state.json`, publish hub witnesses, provide verification commands |
| bridge-os     | Host hub witnesses under `pm/ci/`                                                         |
| Product repos | Consume hub witness before declaring blockers; surface Class A/S gates as parallel        |

## Example: markets-os IR-006

```bash
# From markets-os
node ../fabric-os/platform/scripts/staging/verify-markets-os-staging-chain.mjs --json
# or read hub witness
cat ../bridge-os/pm/ci/fabric-os-blocker-fb001-latest.json
```

If the witness shows:

- `infrastructureReady: true`
- `secretsPopulated: false`

Then `IR-006` is **not hard-blocked** on engineering. It is awaiting a Class A operator action, which should be surfaced under `### Approval needed` or `### Parallel sovereign gates`, not as a story blocker.

## Enforcement

- fabric-os CI writes hub witnesses on every push.
- Product-repo CI reads the hub witness before marking cross-repo stories blocked.
- `agent:next-work` implementations should incorporate this check as a pre-filter.
