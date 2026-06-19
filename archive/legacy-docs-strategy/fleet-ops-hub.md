---
title: 'Fleet ops hub strategy — fabric-os'
status: current
date: 2026-06-17
owner: fabric-os
tier: operating
tags: ['strategy', 'protocol', 'coo', 'documentation']
review_cycle: on-change
document_type: protocol
goals: 'Hub documentation — fleet COO protocol'
---

# Fleet ops hub strategy — fabric-os

> **Authority:** [`../../bridge-os/pm/spec/ops-authority.json`](../../bridge-os/pm/spec/ops-authority.json)  
> **Placement:** [`../../bridge-os/pm/spec/ops-home-placement.json`](../../bridge-os/pm/spec/ops-home-placement.json)  
> **Service fabric:** [`../../bridge-os/pm/spec/service-fabric.json`](../../bridge-os/pm/spec/service-fabric.json)  
> **CORE runtime:** [`../../bridge-os/pm/spec/core-runtime-engine-protocol.json`](../../bridge-os/pm/spec/core-runtime-engine-protocol.json)

**fabric-os** is the **tactical Chief Operating Officer (COO)** of the GTCX ecosystem. It does not build every product feature; it decides how the fleet runs, deploys, secures, bills, and assures — and what evidence proves operational readiness. Owner repos retain domain runtime; cross-repo ops programme authority lives in fabric-os.

---

## Dual hat (same repo, separate write surfaces)

| Axis        | Tier         | fabric-os writes                                                    | Does not write                                         |
| ----------- | ------------ | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **Product** | L2 programme | `docs/operations/coordination/*`, XR handoffs                       | `pm/roadmap/sprints/active.json`, fleet sprint backlog |
| **Ops**     | L3 COO       | `pm/ecosystem-ops-backlog.json`, lane witnesses, friction registers | Product sprint backlog (`agile-os`)                    |

See [`sprint-authority.json`](../../bridge-os/pm/spec/sprint-authority.json) for L2 product programme rules — unchanged by COO Wave 1.

---

## Vision

> **fabric-os is a self-improving ops protocol that turns every lane signal, every deploy, and every friction item into a fleet witness that makes the next ops decision better.**

```
SENSE → REASON → ACT → LEARN
```

| Phase  | Artifact                            | Owner                      |
| ------ | ----------------------------------- | -------------------------- |
| Sense  | `pm/*-friction-register.json`       | Lane owner (mostly fabric) |
| Reason | `pm/ecosystem-ops-backlog.json`     | **fabric-os**              |
| Act    | `REM-*` in owner `pm/backlog.json`  | Lane owner repo            |
| Learn  | `audit/evidence/*` + bridge rollups | fabric + bridge            |

---

## North star

> **Fleet ops friction flows through fabric-os before policy duplicates anywhere else.**

| Metric                      | Target                  | Witness                          |
| --------------------------- | ----------------------- | -------------------------------- |
| Local consumption pass rate | ≥ 95% pilot repos       | `audit/evidence/ops-latest.json` |
| fabric:ops:check            | Green on reference impl | `pnpm fabric:ops:check`          |
| Open P0 friction triage     | ≤ 7 days                | `pm/ecosystem-ops-backlog.json`  |

---

## Authority boundaries

| Area                   | Owner         | fabric-os role                                              |
| ---------------------- | ------------- | ----------------------------------------------------------- |
| Fleet ops backlog      | **fabric-os** | Tactical COO: prioritizes ops programmes and REM delegation |
| Product sprint backlog | **agile-os**  | Reads for programme orchestration (L2) — does not override  |
| Constitutional specs   | **bridge-os** | Consumes `ops-authority.json`, `ops-pack.json`              |
| Domain runtime         | Owner repo    | Consumes DaaS/SECaaS/PayOps substrate                       |
| P22 engineering        | Owner repo    | Parallel ops lanes — `blocksIR: false`                      |

---

## Key milestones

| Milestone               | Definition of done                                                 | Status                                     |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| OPS-AUTHORITY-NORMATIVE | `ops-authority.json` + `ops-home-placement.json` in bridge         | Wave 1                                     |
| COO-REFERENCE-IMPL      | `fabric:ops:check` + `ecosystem-ops-backlog.json` + `ops/coo.md`   | Wave 1                                     |
| CONSUMPTION-PILOT       | markets-os, terminal-os, baseline-os `ops:consumption:check` green | Wave 1                                     |
| ASSURANCE-ORCHESTRATOR  | agile-os milestone gates on fabric COO witness                     | Blocked → unblocks when lane witness green |

---

## Local repo contract

Product repos prove **consumption**, not **authorship**:

- `ops/coo.md` → this charter
- `ops/legal/manifest.json` → href to fabric registers
- `docs/operations/deployment-profile.json` when deployable
- `pnpm ops:consumption:check` → `audit/evidence/ops-latest.json`

**Forbidden:** fork `pm/*-friction-register.json` in product repos.

---

## Harness

| Layer          | Command                              | Where      |
| -------------- | ------------------------------------ | ---------- |
| L1 local       | `pnpm ops:consumption:check`         | Every repo |
| L3 hub         | `pnpm fabric:ops:check`              | fabric-os  |
| Constitutional | `pnpm ecosystem:ops-authority:check` | bridge-os  |

Fat hub check delegates fleet witnesses to bridge — hub orchestrates, bridge writes rollups.
