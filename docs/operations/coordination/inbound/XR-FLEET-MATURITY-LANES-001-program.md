---
title: 'XR-FLEET-MATURITY-LANES-001 — fleet maturity lane separation program'
status: sealed
date: 2026-06-24
owner: fabric-os
initiative: INIT-XR-FLEET-MATURITY-LANES
ticket: XR-FLEET-MATURITY-LANES-001
policy: GS-MATURITY-LANE-001
authorityClass: R
protocol: P24
blocksIR: false
---

# XR-FLEET-MATURITY-LANES-001 — program backlog (cross-repo)

> **Policy SoR:** `baseline-os/pm/spec/maturity-lane-separation.json`  
> **Enforcement owner:** fabric-os (assurance lane) · bridge-os (fleet gates) · baseline-os (policy + P22 compose) · agile-os (sprint ceremony)

## Problem

External assurance (pen-test vendor calendar, SOC2 letter, DPA/LOI countersign, legal Class S) is surfacing as **product/engineering GTM blockers** across the fleet. Africa / Global South integrator-pilot (`GR-T2`) must ship on **engineering maturity** — international procurement evidence is a **parallel track**.

## Program outcome

| Lane                       | Signal                                                          | Must NOT require                        |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| Engineering maturity       | composite, MPR, deploy witness, demo-readiness, product backlog | SOC2, pen-test report, DPA, LOI         |
| External assurance         | fabric-os SECAS/Legal witnesses                                 | Engineering `backlogClear`, sprint seal |
| Integrator-pilot GTM       | `GR-T2-ready`, `pilotReady` (engineering)                       | Enterprise procurement gates            |
| Enterprise procurement GTM | `GR-T3+` segment checklist                                      | — (parallel only)                       |

## Wave plan

| Wave | Repo        | Stories                    | Unblocks                                                    |
| ---- | ----------- | -------------------------- | ----------------------------------------------------------- |
| W0   | baseline-os | MATURITY-LANE-BL-001..003  | Policy witness + P22 value compose                          |
| W1   | fabric-os   | MATURITY-LANE-FAB-001..005 | Assurance witness schema + health probe + central programme |
| W2   | bridge-os   | MATURITY-LANE-BRG-001..004 | Fleet diagnostic + session render                           |
| W3   | agile-os    | MATURITY-LANE-AGL-001..003 | Sprint seal + progress display                              |

## Repo backlog index

| Repo        | Initiative                          | Features                                                                                                                                                                                  | Stories                        |
| ----------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| fabric-os   | `INIT-XR-FLEET-MATURITY-LANES`      | `FEAT-FABRIC-MATURITY-LANE-ENFORCE`, `FEAT-FABRIC-ASSURANCE-WITNESS-LANE`, `FEAT-FABRIC-HEALTH-PROBE-LANE`, `FEAT-FABRIC-SESSION-ASSURANCE-LANE`, `FEAT-FABRIC-CENTRAL-ASSURANCE-PROGRAM` | `MATURITY-LANE-FAB-001`..`005` |
| bridge-os   | `INIT-BRIDGE-MATURITY-LANE-GATES`   | `FEAT-BRIDGE-GTM-LANE-SPLIT`, `FEAT-BRIDGE-PILOT-READINESS-LANE`, `FEAT-BRIDGE-SESSION-LANE-FILTER`                                                                                       | `MATURITY-LANE-BRG-001`..`004` |
| baseline-os | `INIT-BASELINE-MATURITY-LANE-SOR`   | `FEAT-BASELINE-MATURITY-LANE-POLICY`, `FEAT-BASELINE-P22-VALUE-COMPOSE`                                                                                                                   | `MATURITY-LANE-BL-001`..`003`  |
| agile-os    | `INIT-AGILE-MATURITY-LANE-CEREMONY` | `FEAT-AGILE-SPRINT-LANE-SEPARATION`, `FEAT-AGILE-PROGRESS-LANE-DISPLAY`                                                                                                                   | `MATURITY-LANE-AGL-001`..`003` |

## Corrective item → story map

| #   | Corrective action                          | Primary owner         | Stories                                       |
| --- | ------------------------------------------ | --------------------- | --------------------------------------------- |
| 1   | Adopt GS-MATURITY-LANE-001 + check harness | fabric-os             | `MATURITY-LANE-FAB-001`                       |
| 2   | Scrub SECAS/Legal/SOC2 witnesses           | fabric-os             | `MATURITY-LANE-FAB-002`                       |
| 3   | Fix P22 enricher (value bleed)             | baseline-os           | `MATURITY-LANE-BL-002` → bridge `BRG-003`     |
| 4   | Fleet health probe lane separation         | fabric-os             | `MATURITY-LANE-FAB-003`                       |
| 5   | inferGtmReadiness / gtm-progress split     | bridge-os             | `MATURITY-LANE-BRG-001`, `BRG-002`, `BRG-004` |
| 6   | Product session assurance omit             | bridge-os + fabric-os | `MATURITY-LANE-BRG-003`, `FAB-004`            |

## agile-os handoff (2026-06-24)

**Inbound:** [`from-agile-os-assurance-lane-handoff-2026-06-24.md`](./from-agile-os-assurance-lane-handoff-2026-06-24.md)  
**fabric-os ack:** [`../from-fabric-os-xr-fleet-maturity-lanes-001-ack-2026-06-24.md`](../from-fabric-os-xr-fleet-maturity-lanes-001-ack-2026-06-24.md)

## bridge-os handoff (2026-06-24)

**Inbound:** [`from-bridge-os-maturity-lane-feedback-2026-06-24.md`](./from-bridge-os-maturity-lane-feedback-2026-06-24.md)  
**Joint outbound:** [`../outbound/to-bridge-os-infer-gtm-lane-split-2026-06-24.md`](../outbound/to-bridge-os-infer-gtm-lane-split-2026-06-24.md)

bridge executes `BRG-001` / `BRG-003` **in parallel** with fabric Wave 1. Fleet display untrustworthy until **both** land.

| bridge defect                             | Owner story           |
| ----------------------------------------- | --------------------- |
| Linear `inferGtmReadiness`                | `BRG-001`             |
| `session-open-items` blockedExternal      | bridge (open)         |
| Product `parallelClassS` in Proceed Brief | `BRG-003`             |
| `evaluate-gtm-readiness` no lane split    | `BRG-002` + canon P58 |

## fabric-os deliverables (agile-os + bridge-os)

| Req                            | fabric-os deliverable                                                  |
| ------------------------------ | ---------------------------------------------------------------------- |
| A — single assurance programme | `MATURITY-LANE-FAB-005` · `pm/spec/central-assurance-program.json`     |
| B — witness contract           | `pm/spec/assurance-lane-witness-fields.json` · `MATURITY-LANE-FAB-002` |
| C — health probe isolation     | `MATURITY-LANE-FAB-003`                                                |
| D — coordination vocabulary    | `MATURITY-LANE-FAB-004`                                                |

## Program acceptance (seal)

- [x] `pnpm maturity-lane:check:write` PASS in fabric-os
- [x] All SECAS/Legal/SOC2 fabric witnesses include `lane: externalAssurance` + `blocksEngineeringMaturity: false`
- [x] No `blocksAnyRepo: true` on vendor-calendar witnesses
- [x] Central assurance programme — product repos zero blocking assurance stories (`pnpm central-assurance:check:write`)
- [x] Product repo `baseline start` omits assurance gates from Proceed Brief unless `blocksIR: true` (bridge `BRG-003`)
- [x] `inferGtmReadiness` emits `integratorPilotGtm` separate from `enterpriseProcurementGtm` (bridge-os `BRG-001`)
- [x] `daas:fleet:health` does not FAIL product repos on vendor calendar
- [x] Non-assurance P22 `valueCreated` does not cite SECAS milestone DoD (baseline `BL-002`)
- [x] Agile sprint seal does not require external assurance completion (agile `AGL-*`)
- [x] outbound-ack XR-FLEET-MATURITY-LANES-001 filed (fabric-os)

- [x] Joint verification: fleet diagnostic v2 + `gateSegments.procurementSegment` — `integratorPilotReadyCount` reflects S2 demo gates only (not SOC2); engineering 100 + GTM S2 is expected until demo witnesses land

## Inbound acks

| From          | Ticket                                                 | Status                                 |
| ------------- | ------------------------------------------------------ | -------------------------------------- |
| agile-os      | assurance lane handoff 2026-06-24                      | **ack filed** (fabric-os)              |
| bridge-os     | maturity lane feedback 2026-06-24                      | **ack filed** · BRG in flight parallel |
| baseline-os   | `to-fabric-os-maturity-lane-separation-2026-06-24`     | spec filed · ack in-progress           |
| baseline-os   | `to-bridge-os-maturity-lane-separation-2026-06-24`     | spec filed                             |
| baseline-os   | `to-agile-os-maturity-lane-separation-2026-06-24`      | spec filed                             |
| compliance-os | `to-fabric-os-gtm-assurance-lane-amendment-2026-06-24` | spec filed · ack in-progress           |
