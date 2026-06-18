---
title: 'Inbound — W2-OPS-002 POSTGRES_URL unblocked (terminal-os)'
status: closed
date: 2026-06-17
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
from: fabric-os
to: terminal-os
protocol: P24
story: W2-OPS-002
---

# W2-OPS-002 — Hub #18 Postgres persistence — CLOSED

## Decision

`POSTGRES_URL` alias provisioned in AWS SM bundle `gtcx/terminal-os/staging/api-keys` (mirrors existing `DATABASE_URL` → `gtcx-staging-audit` RDS).

## Evidence

| Check                                              | Result                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `patch-terminal-os-postgres-url-sm.sh`             | exit 0                                                           |
| terminal-os `pnpm workflow:locker-18-proof:verify` | exit 0 · `prod-slice-pass`                                       |
| Witness                                            | `terminal-os/audit/evidence/w2-locker-18-terminal-evidence.json` |

## Runtime contract

- **SM path:** `gtcx/terminal-os/staging/api-keys`
- **Keys:** `DATABASE_URL`, `POSTGRES_URL` (same connection string)
- **ESO:** `deploy/kubernetes/overlays/staging/terminal-os/external-secret.yaml`

## P22 impact

`SEC-M1-05` / `PROD-M1-01` closed in terminal-os initiatives — engineering lane no longer blocked on W2-OPS-002.
