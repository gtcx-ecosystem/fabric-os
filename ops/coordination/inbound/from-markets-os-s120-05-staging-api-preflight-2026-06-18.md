---
title: 'Escalation to fabric-os: S120-05 staging API preflight blocker'
status: open
date: 2026-06-18
from: markets-os
to: fabric-os
authority_class: R
blocks_ir: true
owner_repo: fabric-os
requesting_repo: markets-os
story: S120-05
maps_to: PROD-READY-005
---

# Escalation to fabric-os: S120-05 staging API preflight blocker

## Summary

`markets-os` advanced `S120-05 / PROD-READY-005` to an in-progress,
instrumented state, but cannot certify the transaction test run e2e until the
staging API chain is reachable with the expected credentials and service URLs.

Latest deterministic selector still returns:

- story: `S120-05`
- status: `in_progress`
- selection tier: `resume-in_progress`
- reason: `Story already in_progress`

## Evidence

Markets commit: `ae565db9 feat(ops): harden transaction test run preflight`

Evidence artifacts:

- `audit/evidence/transaction-test-run-latest.json`
- `docs/operations/evidence/first-deals/transaction-test-run-latest.json`
- `platform/scripts/fixtures/first-deal-staging-human-gates.json`

Passing local/static gates:

```bash
node --check platform/scripts/run-first-deal-dry-run.mjs
node --check platform/scripts/run-k3-staging-dry-run-gate.mjs
node --check platform/scripts/run-pilot-golden-transaction.mjs
pnpm transaction-test-run:check
pnpm roadmap:check
```

Live preflight command:

```bash
GTX_DRY_RUN_TIMEOUT_MS=100 node platform/scripts/run-first-deal-dry-run.mjs prepare \
  --config platform/scripts/fixtures/first-deal-staging-sample.json \
  --state-folder /tmp/markets-os-ttr-preflight-check
```

Observed result:

```text
fatal: preflight failed for prepare: advisory-api http://localhost:4100/health unreachable; auth=no-token; prerequisite=advisory-api must be started or the staging URL must be set before prepare
```

The evidence JSON records:

- phase: `prepare`
- status: `phase_fail`
- service: `advisory-api`
- endpoint: `http://localhost:4100/health`
- auth mode: `no-token`
- missing prerequisite: `advisory-api must be started or the staging URL must be set before prepare`

## Request to fabric-os

Provide the staging/runtime assurance needed for markets-os to complete
`S120-05`:

1. Confirm the staging API chain for transaction-test-run is reachable:
   - `ADVISORY_API_URL`
   - `BROKERAGE_API_URL`
   - `FUND_API_URL`
2. Confirm the runtime credential path for the dry-run:
   - `GTX_MARKETS_API_TOKEN` or `INTERNAL_SERVICE_TOKEN`
   - no raw secret values in docs or chat
3. Provide or validate the fabric-owned staging harness/runner that can execute:
   - `pnpm transaction-test-run:check`
   - `pnpm transaction-test-run prepare ...`
   - `pnpm transaction-test-run provision-capital ... --gate-fixture ...`
   - `pnpm transaction-test-run record-payment ... --gate-fixture ...`
4. Return a witness path or copied evidence proving the health probes and
   transaction writes completed against staging APIs.

## Boundary

This is not a request for production deployment, legal approval, bank-wire
approval, or production credential disclosure. The markets-os runner now
preserves human-gate boundaries through a staging-only fixture and refuses
`GTX_MARKETS_ENV=production`.

`PROD-READY-006` remains the security/RBAC hardening story; this escalation is
only for staging API availability and runtime-assurance execution needed to
complete `PROD-READY-005`.

## Expected response

Fabric-os should file an inbound acknowledgement and either:

- provide a passing staging witness artifact, or
- name the missing staging service/credential prerequisite and owning action.
