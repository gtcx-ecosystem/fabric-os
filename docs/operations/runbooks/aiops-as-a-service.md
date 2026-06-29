---
title: 'AIOps-as-a-Service operator runbook'
status: current
date: 2026-06-29
owner: fabric-os
document_type: runbook
tier: operating
review_cycle: on-change
---

# AIOps-as-a-Service (substrate) — operator runbook

**Protocol:** P49-AIOPS-AS-A-SERVICE · **Lane:** AIOps · **Owner:** fabric-os
**Spec (SoR):** `machine/spec/aiops-as-a-service.json`
**Hub protocol:** `canon-os/docs/governance/protocols/49-aiops-as-a-service/protocol.md`

## What this lane does

fabric-os supplies the **agentic reliability substrate** — the signals, friction
register, and harness that let the fleet detect and shorten incidents (MTTR) across
agent-driven operations. It does not run the fleet gate (bridge-os) or own MLOps
(baseline-os); it provides the substrate those depend on.

## Ownership split

| Concern                                                   | Owner         | Entry                                                                |
| --------------------------------------------------------- | ------------- | -------------------------------------------------------------------- |
| Reliability substrate (spec, registers, harness, witness) | **fabric-os** | `pnpm aiops:check`                                                   |
| Fleet anomaly gate                                        | bridge-os     | `ecosystem:aiops:check:fleet` → `machine/ci/aiops-fleet-latest.json` |
| MLOps (model lifecycle)                                   | baseline-os   | `mlops:check` → `machine/spec/mlops-as-a-service.json`               |

## Artifacts (fabric-os)

| Artifact                     | Path                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| Spec (SoR)                   | `machine/spec/aiops-as-a-service.json`                               |
| Kaleidoscope trace/eval sink | `pm/spec/kaleidoscope-ai/trace-eval-sink.schema.json`                |
| Kaleidoscope sink runbook    | `docs/operations/platform-services/kaleidoscope-trace-eval-sinks.md` |
| Friction register            | `machine/aiops-friction-register.json`                               |
| Signals register             | `machine/aiops-signals-register.json`                                |
| Harness                      | `platform/scripts/aiops-check.mjs`                                   |
| Witness                      | `audit/evidence/aiops-check-latest.json`                             |
| This runbook                 | `docs/operations/runbooks/aiops-as-a-service.md`                     |

## Run the check

```bash
pnpm aiops:check          # evaluate the lane (MPR-shaped: foundation + transformational)
pnpm aiops:check:write    # also write audit/evidence/aiops-check-latest.json
```

The harness scores 11 pillars; **foundation must be ≥ 80** to pass (exit 0). Foundation =
compliance (spec + both registers present), technicalExcellence (harness wired),
craft (this runbook present), worldClass, trustAndSafety (no secrets in registers).

## Signals monitored

Defined in `machine/aiops-signals-register.json`:

- `agent-conduct-drift` — agent behavior diverging from conduct rules.
- `settlement-gate-fail` — atomic settlement gate failures (commit/push).
- `assurance-milestone-block` — assurance milestone blocked.

Each signal is an anomaly source; the fleet rollup (bridge-os) aggregates them across repos.

## Friction register

`machine/aiops-friction-register.json` holds open reliability gaps (e.g. `AIOPS-ANOM-01`
— wire the fleet anomaly detector to the agent-conduct witnesses). Each item carries
`priority`, `status`, `owner`, and `blocksIR`. Work items off this register; close them
with evidence in the witness.

## Escalation

- Foundation < 80 → the harness exits non-zero; resolve the failing pillar (the witness
  `errors[]` names it) before merging.
- A P1 friction item open > cadence → raise via Protocol 24 coordination to the named owner.
- Anomaly signal firing fleet-wide → bridge-os fleet gate is the coordination witness.
