---
title: Ecosystem Remediation Report — repos under 8.5
status: current
date: 2026-06-25
owner: fabric-os
document_type: audit
tier: operating
review_cycle: on-change
source: institutional-readiness-audit-notes-2026-06-25 (per repo)
---

# Ecosystem Remediation Report — All Repos Under 8.5

Date: 2026-06-25 · Source: fresh per-repo `institutional-readiness-audit-notes-2026-06-25.md` · Lane: fabric-os independent assurance.

Scope: every repo scoring **< 8.5** in the 2026-06-25 audit (17 of 18; baseline-os at 8.5 is excluded). Adoption labels: A0 general/bank-grade (post external assurance) · A1 90-day controlled · A2 pilot/controlled field · A3 internal substrate · A4 prototype/docs-first.

## Readiness ladder (current → target)

| Repo           | Score | Label      | Single gating action                                       | Target                 |
| -------------- | ----- | ---------- | ---------------------------------------------------------- | ---------------------- |
| fabric-os      | 8     | A1         | Close external pen-test (scope staged)                     | A0                     |
| agile-os       | 8     | A3         | Drive fleet ship-readiness ledger 4/17 → run-path evidence | A3+                    |
| bridge-os      | 7.5   | A3·A1      | Pass own P35 (composite 59 → ≥85 unlock)                   | A1 embedded            |
| exploration-os | 7.5   | A2         | Clear ops:check + P35; device UAT                          | A1 scoped              |
| ledger-os      | 7.5   | A2→A1      | Unblock inspection-os FS-P2-002 (external)                 | A1                     |
| griot-ai       | 7     | A2         | Remote staging + signed pilot SOW                          | A1                     |
| ledger-ui      | 7     | A1(paired) | Finance surfaces + approval primitive + UAT                | A1 standalone-adjacent |
| reports        | 7     | A3         | Provenance metadata + 11PR realignment                     | A3+                    |
| terminal-os    | 7     | A2         | External sign-off (legal/SOC2/pen-test)                    | A1                     |
| ecosystem-os   | 6.5   | A3         | A0–A4 dashboard + refresh composite                        | A3+                    |
| markets-os     | 6.5   | A2         | PROD-READY-005 deal-e2e (no-go → go)                       | A1                     |
| nyota-ai       | 6.5   | A1/A2      | **P0** restore readiness gate + model governance           | A2 honest              |
| gtcx-os        | 6     | A1(1 wf)   | Close master-audit P0s + live golden transaction           | A1 backed              |
| veritas-ai     | 5     | A1/A2      | **P0** fix verification test + crypto vectors              | A2 honest              |
| internal       | 4     | A3         | Evidence-boundary policy + SoT map                         | A3                     |
| venture-os     | 4     | A3         | Fix lint→ops:check red; pilot-journey witness              | A3+                    |
| inspection-os  | 3     | A4         | Executable workflow + signed evidence bundle               | A2                     |

## Tier P0 — red gates / regressions (fix first; these falsify current claims)

These block honest self-reporting; a repo cannot make an adoption claim while its own primary signal is red.

| Repo           | Defect                                                                                                              | Remediation                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| nyota-ai       | `gtm:readiness:check` exits 1 — `ERR_MODULE_NOT_FOUND` `platform/scripts/lib/executable-backlog.mjs`                | Restore module / fix import in `evaluate-gtm-readiness.mjs`; re-run gate to green                                                                                              |
| veritas-ai     | Verification test red; crypto compatibility vectors deleted; README link rot to moved governance docs               | Restore compatibility vectors (VR-G1); repoint README to `docs/architecture/security/`; make verification test pass — **disqualifying for a verification product until fixed** |
| markets-os     | `pilot-golden-transaction-latest.json` regressed (failing)                                                          | Restore live staging API chain with fabric-os; flip `production-launch-readiness` off `no-go-production`                                                                       |
| venture-os     | `pnpm lint` FAILS (2 `react-hooks/set-state-in-effect`) → `ops:check` red; GTM witness `opsCheckPass:true` is stale | Fix hooks; regenerate GTM witness so it reflects current tree                                                                                                                  |
| bridge-os      | layout-strict 45 / hub-resolve 0 / layout-contract 0 → compliance quadrant < 85, `composite100: 59` partial-unlock  | Pass the P35 gate bridge enforces on the fleet; lift composite out of partial-unlock                                                                                           |
| exploration-os | `ops:check` root-cleanliness + `P35 strict` red; world-class composite below 85 unlock                              | Clear both gates so the pillar can publish                                                                                                                                     |
| gtcx-os        | master-audit P0s: CI legacy-path failures, witness drift, `pnpm install` failure                                    | Green the pipeline before any "deployable" claim                                                                                                                               |

## Tier P1 — external assurance + production proof (the A1→A0 spine)

The most common cross-repo blocker. No repo should claim bank-grade/A0 until these are externally inspectable.

- **External assurance pack (SOC2 path, pen-test, DPA/DPIA, SSO):** fabric-os (pen-test scope staged — execute), griot-ai (unblock pen-test `F-sec-06`, SOC2 Type I, DPA), gtcx-os (pen-test scope + threat model — 6 items `not-started`), terminal-os (SOC2, pen-test, prod SSO, immutable export — gaps declared), nyota-ai (DPA/SOC2/pen-test are stubs), markets-os (independent assurance lane), veritas-ai (authority-boundary matrix VR-G3).
- **Live staging / production transaction witness:** griot-ai (localhost → `remoteStagingVerified`), markets-os (deal-e2e golden transaction L1 exit 0), gtcx-os (corridor SOW → one-commodity/one-jurisdiction live witness), exploration-os (device-level UAT behind S12-01).
- **Signed pilot SOW / north-star pilot journey:** griot-ai (`institutional-pilot-signed` pending → executed), terminal-os (external/human sign-off), venture-os (`venture-pilot-journey-latest.json` missing — PG2 unproven), gtcx-os.
- **Claims discipline (stop score inflation):** nyota-ai (security/enterprise/bank-grade all 100 on doc-existence rubrics while controls are stubs), gtcx-os, veritas-ai — replace existence-rubric 100s with capability/eval evidence; adopt terminal-os-style prohibited-language guardrails fleet-wide.

## Tier P2 — integration admissibility + buyer-legible artifacts

- **Admissibility / integration chains:** inspection-os (outputs → admissible inputs for ledger/markets/compliance/gtcx; clear `ESL-3`), exploration-os (SIR tiers draft/verified/finance-ready → Terra/Inspection/Ledger/Markets handoff), ledger-os (external dep `inspection-os:FS-P2-002` — connectors fixture-bound G4-12), ledger-ui (bind evidence-linking model to ledger-os/inspection-os/compliance-os/markets-os), markets-os (IR-GAP-024 asset-eligibility chain).
- **Buyer-legible dossiers/surfaces:** fabric-os (institutional assurance packet + one end-to-end cross-repo evidence transcript), bridge-os (risk-reduction programme transcript for a named ministry/operator/bank), ecosystem-os (A0–A4 readiness dashboard + deployable bundles + evidence-packet index), reports (per-report provenance metadata + draft/internal/external/buyer separation + 11PR realignment), ledger-ui (collateral/eligibility/counterparty/reconciliation surfaces + permissioned approval primitive).
- **Domain depth:** markets-os (surveillance stub → exchange-grade; settlement staging → live; Aurora PITR transcript + OTLP export), ledger-ui (approval workflow with audit write, not display-only).

## Recommended sequencing

1. **Week 1 — P0 sweep.** Fix the 7 red gates/regressions above. These are in-repo engineering, no external dependency. Re-run each repo's primary gate to green so subsequent scores are honest. Highest urgency: nyota-ai and veritas-ai (primary product signal is red).
2. **Weeks 2–6 — P1 assurance spine.** Stand up one shared external-assurance track (pen-test + SOC2 path + DPA template) coordinated through fabric-os independent assurance lane; land at least one live staging golden-transaction witness per A1-aspirant (markets-os, gtcx-os, griot-ai). Execute one signed pilot SOW.
3. **Weeks 4–12 — P2 integration + dossiers.** Close admissibility chains (inspection-os → ledger/markets), ship the A0–A4 ecosystem dashboard, and publish buyer-legible assurance packets for the A1 spine (fabric-os, markets-os, gtcx-os, ledger-os/ledger-ui).

## Cross-cutting note

The 2026-06-25 pass was honesty-correcting: scores fell where regressions were found (veritas-ai, gtcx-os, nyota-ai vs. their optimistic priors), and agile-os's new run-path-only ship-readiness ledger (4/17 shipped) is the fleet's best anti-process-theater instrument. Remediation should be measured against that ledger's run-path evidence, not sprint-seal counters or composite scores.
