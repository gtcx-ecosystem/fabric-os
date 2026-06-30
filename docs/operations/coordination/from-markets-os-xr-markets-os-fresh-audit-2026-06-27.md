---
title: 'Inbound handoff — markets-os fresh audit / PROD-READY-005'
status: current
date: 2026-06-27
owner: fabric-os
from_repo: markets-os
ticket: XR-MARKETS-OS-FRESH-AUDIT-2026-06-27
blocked_work: PROD-READY-005
document_type: coordination
tier: critical
tags: ['coordination', 'markets-os', 'staging', 'credentials', 'protocol-24']
review_cycle: on-change
---

# Inbound handoff — markets-os fresh audit / PROD-READY-005

**Message type:** `COORDINATION_HANDOFF` (P24 inbound)

- **From repo:** markets-os
- **To repo:** fabric-os
- **Story / ticket:** XR-MARKETS-OS-FRESH-AUDIT-2026-06-27 / PROD-READY-005
- **Blocker:** markets-os staging API chain not reachable; runtime credential path missing for advisory-api
- **Evidence path:**
  - `audit/independent/markets-os/feedback/audit-response-2026-06-27.md` (this repo sibling audit)
  - `markets-os/docs/operations/coordination/to-fabric-os-s120-05-staging-api-preflight-2026-06-18.md`
  - `markets-os/machine/readiness-snapshot.json`
  - `markets-os/audit/evidence/transaction-test-run-latest.json`
- **Resume when:** staging services reachable on localhost/ELB + `transaction-test-run-latest.json` shows `prepare`, `provision-capital`, `record-payment` all `phase_passed` with exit 0

## What markets-os is reporting

- Independent audit score accepted: **7.8 / 10** (A2 pilot-ready, not production-ready).
- `pnpm ops:check` PASS, `pnpm ledger-ui:consumption:check` PASS, `pnpm production:launch-readiness:check` PASS (decision remains `no-go-production`).
- `pnpm roadmap:status --id PROD-READY-005` still reports **blocked** on staging API chain/credentials.
- The only remaining P0 blocker to reach 8.5 readiness is fabric-os-owned runtime/credential delivery.

## Required fabric-os deliverable

Provide the live staging substrate for markets-os so it can run the end-to-end transaction test run:

1. **Staging credential injection**
   - `node platform/scripts/staging/populate-env-from-sm.mjs --write` (or equivalent fabric-os secret-manager path)
   - Ensure `advisory-api` auth token / `no-token` resolution is available to markets-os runner.

2. **Reachable staging services**
   - `docker compose --env-file deploy/docker/.env.staging -f deploy/docker/docker-compose.yml up -d`
   - Health probes green:
     - `curl -sS http://localhost:4100/health`
     - `curl -sS http://localhost:4200/health`
     - `curl -sS http://localhost:4500/health`

3. **Witness target**
   - markets-os will re-run:
     - `pnpm first-deal:dry-run -- prepare --config platform/scripts/fixtures/first-deal-staging-sample.json --state-folder /tmp/markets-os-ttr-live`
     - `pnpm first-deal:dry-run -- provision-capital ...`
     - `pnpm first-deal:dry-run -- record-payment ...`
   - Completion signal: `audit/evidence/transaction-test-run-latest.json` flips to `phase_passed` for all three phases.

## Authority

- **Class A** — requires operator authorization to provision live staging credentials/certificates.
- Agent role: register, witness, and execute Class R documentation/verification only.

## Local fabric-os register link

Tracked in [`fabric-os-fleet-unblock-register-2026-06-25.md`](./fabric-os-fleet-unblock-register-2026-06-25.md) as **FB-001**.
