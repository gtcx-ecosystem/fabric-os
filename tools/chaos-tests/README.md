# `tools/chaos-tests/` — Resilience chaos fixtures

Node test fixtures for offline-queue and restart semantics. Invoked from `infra/scripts/validate.sh` (ADR-019 exemption — single-purpose, not a workspace package).

| File                             | Purpose                                 |
| -------------------------------- | --------------------------------------- |
| `offline-queue-restart.test.mjs` | Offline queue restart safety regression |

**Related:** [`tools/chaos/`](../chaos/README.md) (network partition tests) · [`tools/replay-protection/`](../replay-protection/README.md)
