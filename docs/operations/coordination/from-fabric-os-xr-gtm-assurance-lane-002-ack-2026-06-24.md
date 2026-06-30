---
title: 'outbound-ack — XR-GTM-ASSURANCE-LANE-002'
status: done
date: 2026-06-24
from: fabric-os
to: compliance-os, bridge-os, canon-os, baseline-os
initiative: INIT-GLOBAL-SOUTH-GTM
ticket: XR-GTM-ASSURANCE-LANE-002
related: XR-FLEET-MATURITY-LANES-001, GS-GTM-STAGE-002, GS-MATURITY-LANE-001
authorityClass: R
protocol: P24
blocksIR: false
owner: fabric-os
document_type: runbook
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# outbound-ack — XR-GTM-ASSURANCE-LANE-002 (fabric-os slice)

- **Status:** done
- **Owner:** fabric-os
- **Policy:** `baseline-os/machine/spec/maturity-lane-separation.json` — `externalAssurance.blocksGtmStage: false`

## Ack

fabric-os accepts inbound [`compliance-os/operations/coordination/outbound/to-fabric-os-gtm-assurance-lane-amendment-2026-06-24.md`](../../../compliance-os/operations/coordination/outbound/to-fabric-os-gtm-assurance-lane-amendment-2026-06-24.md).

Pen-test, SOC2, DPA, privacy, SSO, and FedRAMP witnesses ingested via fabric-os **do not** cap `gtm.stage` or block S3 GA / S4 Enterprise labels when product gates are green. Assurance is **parallel procurement qualification** (`procurementAssurance.*` gaps), not a universal stage ceiling.

## Delivered (fabric-os)

| #   | Requirement                                                                | Witness                                                                                                     |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | All SECAS / legal / external-cert witnesses carry lane separation fields   | `pnpm maturity-lane:check:write` — 7/7 pass                                                                 |
| 2   | Witness contract spec                                                      | `pm/spec/assurance-lane-witness-fields.json`                                                                |
| 3   | Fleet health probe isolation — no FAIL on missing pen-test for GTM stage   | `platform/tools/scripts/cross-repo-health-probe.mjs` — `parallelAssurance.blocksEngineeringMaturity: false` |
| 4   | Central assurance programme (product repos reference fabric only)          | `pnpm central-assurance:check:write` PASS                                                                   |
| 5   | Coordination vocabulary — Parallel assurance lane, not "GTM blocked at S4" | `docs/operations/coordination/from-fabric-os-xr-fleet-maturity-lanes-001-ack-2026-06-24.md`                 |

## Joint dependencies (sibling owners — verified)

| Owner         | Slice                                                             | Verification                                                  |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| bridge-os     | `inferGtmReadiness` product vs procurement split                  | `pnpm --dir ../bridge-os audit:gtm-assurance-lane:check` PASS |
| canon-os      | `gtmStageModel` GS-GTM-STAGE-002 + witness v2 schema              | `canon-os/machine/spec/gtm-product-readiness-standard.json`   |
| agile-os      | Milestone display — assurance does not downgrade active milestone | `pnpm --dir ../agile-os ecosystem:sprint-lane:check:write`    |
| compliance-os | v2 witness on disk + evaluate-gtm-readiness write path            | `audit/evidence/gtm-readiness-latest.json` schema v2          |

## Verification path

```bash
pnpm maturity-lane:check:write
pnpm central-assurance:check:write
pnpm --dir ../bridge-os audit:gtm-assurance-lane:check
pnpm --dir ../bridge-os ecosystem:fleet-diagnostic:refresh:write --repo compliance-os
jq '{schema, gtmStage, gaps: .gaps[:5], soc2: .procurementAssurance.enterpriseUsEu.gates.soc2Path}' \
  ../compliance-os/audit/evidence/gtm-readiness-latest.json
```

**Target:** `gtmStage` from product gates; `procurementAssurance.enterpriseUsEu.soc2Path === false` does not appear as `S4:soc2Path` in `gaps`.
