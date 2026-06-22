# Execution roadmap — fabric-os

> **Last reconciled:** 2026-06-17 · `execute-roadmap` · Q3 ship pillar (`PROG-CONTINENTAL-CAPITAL`)

## Active programme

| Field              | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| Quarter            | `GTCX-Q3-2026` · pillar **ship**                       |
| Programme          | `PROG-CONTINENTAL-CAPITAL`                             |
| Initiative         | `INIT-GTCX-Q3-2026` (fleet tree in agile-os)           |
| Head story (SECAS) | `SECAS-S4-04` — **done** (`internal_closure_complete`) |
| Parallel Q3 ship   | `Q3-FABRIC-*` — substrate witnesses                    |

## Phase — Q3 ship substrate (active)

| Story          | Status   | UAT / witness                                                                                                     |
| -------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `Q3-FABRIC-01` | **done** | `pnpm pilot:staging-smoke:write` → `audit/evidence/pilot-staging-smoke-latest.json`                               |
| `Q3-FABRIC-02` | **done** | `pnpm pilot:golden-transaction-substrate:write` → `audit/evidence/pilot-golden-transaction-substrate-latest.json` |
| `Q3-FABRIC-03` | pending  | SECAS supply-chain                                                                                                |
| `Q3-FABRIC-04` | **done** | `pnpm pilot:fleet-observability:write` → `machine/ci/fleet-observability-latest.json`                             |

## Blockers

| ID                                 | Owner          | Note                                                                  |
| ---------------------------------- | -------------- | --------------------------------------------------------------------- |
| `fabric:assurance` uat-independent | bridge catalog | Non-blocking for GT substrate choreography; witness documents partial |

## Next story

Next: `Q3-FABRIC-03` (SECAS supply-chain).

**Normative hierarchy:** `agile-os/pm/spec/fleet-work-hierarchy-protocol.json`
