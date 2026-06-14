---
title: Pen-test kickoff prep — post EXT-INF-002 approval
status: current
date: 2026-06-10
owner: fabric-os
program: INIT-GTCX-INFRA-SECAS
storyId: SECAS-S2-01
authorityClass: A
tags: ['coordination', 'pen-test', 'secas-s2', 'ext-inf-002']
---

# Pen-test kickoff prep (SECAS-S2-01)

**Prerequisite:** EXT-INF-002 sovereign approval recorded (`audit/evidence/ext-inf-002-sow-approval-2026-06-10.json`).

**Countersign:** approved 2026-06-10 — [`ext-inf-002-countersign-approval-2026-06-10.json`](../../../audit/archive/2026-06-14/audit/evidence/ext-inf-002-countersign-approval-2026-06-10.json).

**Window:** scheduled 2026-06-17..21 — [`pen-test-window-2026-06-10.json`](../../../audit/archive/2026-06-14/audit/evidence/pen-test-window-2026-06-10.json) · [seal](./from-fabric-os-pen-test-window-scheduled-2026-06-10.md).

**Next:** Ingest vendor report after window execution.

## Intake pack (attach to vendor kickoff)

| Artifact        | Path                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------- |
| Scope           | `audit/pen-test-scope-2026.md`                                                            |
| RFP             | `audit/pen-test-rfp-2026.md`                                                              |
| Intake evidence | `audit/pen-test-intake-evidence-2026-05-31.md`                                            |
| Vendor pack ack | `docs/operations/coordination/outbound/from-fabric-os-ext-inf-002-pack-ack-2026-06-07.md` |
| Fleet witness   | `audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json`                    |

## In-scope staging targets (post-DAAS-S1/S3) — by lane

| Lane    | Target                                                  | deployProduct  |
| ------- | ------------------------------------------------------- | -------------- |
| **T0**  | protocols staging API + admin paths                     | protocol rail  |
| **L4a** | `sovereign-staging.gtcx.trade`                          | GTCX Sovereign |
| **L4b** | `api.staging.gtcx.trade` — AGX + authority stub routes  | GTCX Cloud     |
| **L2**  | `intelligence-staging.gtcx.trade` — cost router enabled | product-hosted |
| **L3**  | compliance-gateway staging (optional — 525 known)       | product-hosted |

Full boundary spec: [`audit/pen-test-scope-2026.md`](../../../audit/pen-test-scope-2026.md) §2.1b

## Post-countersign actions (fabric-os)

1. Confirm test window with vendor
2. Publish `audit/evidence/pen-test-window-YYYY-MM-DD.json`
3. Ingest final report to `audit/evidence/pen-test-report-YYYY-MM-DD.json` — `pnpm secas:pentest:report:ingest -- --input=<vendor-report.json>` then `pnpm secas:pentest:ingest:check:write`
4. Close SEC-PENTEST-01 / SECAS-S2-01
