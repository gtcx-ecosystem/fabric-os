---
title: 'Inbound — platforms S2-07 TypeORM phase 1 (infra S1-02 drift)'
status: current
date: 2026-06-05
owner: fabric-os
tier: operating
tags: [['coordination', 'inbound', 'typeorm', 'migrations']]
review_cycle: on-change
document_type: runbook
from: gtcx-platforms
work_ids: [S1-02, S2-07]
---

# Inbound — platforms S2-07 phase 1 complete

**Platforms witness:** [`s2-07-typeorm-shared-migrations-2026-06-05.md`](https://github.com/gtcx-ecosystem/gtcx-platforms/blob/main/01-docs/05-audit/s2-07-typeorm-shared-migrations-2026-06-05.md)

## Delivered (entity/migration slice of S1-02)

| Migration                                         | Tables                                        |
| ------------------------------------------------- | --------------------------------------------- |
| `20260605000001-SharedEntitiesStagingParity`      | `outbox`, `idempotency_keys`, `audit_records` |
| `20260605000002-TradepassIdentitiesStagingParity` | `tradepass_identities`                        |

Path: `gtcx-platforms/platforms/shared/03-platform/src/migrations/` — idempotent `CREATE IF NOT EXISTS`, mirrors staging K8s Jobs.

Run:

```bash
cd platforms/shared
DATABASE_URL=... pnpm migrate:run
```

## Infra resume (S1-02 remaining)

1. Update `04-deploy/docker/init-03-platform/scripts/postgres/01-schema.sql` with parity DDL.
2. Retire or gate `staging-migrate-shared-entities` / `migrate-tradepass-identities` Jobs once migration runner is wired in deploy.
3. Phase 2 tables (sovereign, `tradepass_credentials`, drift gate) remain **platforms backlog** — do not block infra 01-schema refresh on phase 2.

**Drift report:** `01-docs/05-audit/evidence/typeorm-schema-drift-2026-06-05.md`
