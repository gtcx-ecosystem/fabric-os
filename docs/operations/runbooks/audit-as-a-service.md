---
title: 'Audit as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'aaas', 'audit', 'fabric']
review_cycle: on-change
---

# Audit as a Service

Fabric OS owns the local Audit-as-a-Service lane for composite audit evidence,
five-core probe consumption, and Fabric assurance witness production.

## System of Record

| Artifact             | Path                                             | Role                                              |
| -------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Audit register       | `machine/audit-friction-register.json`           | AAAS friction state                               |
| Roadmap              | `machine/aaas-roadmap.json`                      | Fabric-owned AAAS roadmap                         |
| Composite witness    | `audit/evidence/composite-audit-latest.json`     | Latest composite audit witness                    |
| AAAS check           | `platform/scripts/aaas-friction-check.mjs`       | Local AAAS gate                                   |
| Latest witness       | `audit/evidence/aaas-friction-check-latest.json` | Local AAAS witness                                |
| Honesty gate         | `platform/scripts/aaas-honesty-gate.mjs`         | Anti-superficiality validator                     |
| Coverage claims      | `audit/evidence/aaas-honesty-coverage.json`      | Per-capability audit coverage                     |
| Honesty witness      | `audit/evidence/aaas-honesty-gate-latest.json`   | Latest honesty-gate witness                       |
| Coverage denominator | `machine/canon/registry.json`                    | Capabilities the audit must cover (from canon-os) |
| Cadence runner       | `platform/scripts/aaas-cadence.mjs`              | Nightly heartbeat + witness-freshness gate        |
| Cadence witness      | `audit/evidence/aaas-cadence-latest.json`        | Latest freshness witness                          |

## Commands

```bash
pnpm aaas:friction:check
pnpm aaas:friction:check:write
pnpm aaas:honesty:check          # reject "scored the map, not the territory"
pnpm aaas:honesty:check:write
pnpm aaas:cadence                # report witness freshness (ASR-007)
pnpm aaas:cadence:write          # refresh friction + honesty witnesses, then check
```

## Cadence (AAAS-S3)

`platform/scripts/aaas-cadence.mjs` is the assurance heartbeat. `:write` refreshes
the friction + honesty witnesses, then asserts the monitored witnesses
(`aaas-friction-check`, `aaas-honesty-gate`, `composite-audit`, `five-pillar`,
`master-audit`) are within `--max-age-days` (default 3). An undateable witness is
treated as not-verifiable (fails under `--strict`). Witness:
`audit/evidence/aaas-cadence-latest.json`. Runs nightly via
`.github/workflows/aaas-cadence.yml` (advisory; uploads the witness as an
artifact). `five-pillar` freshness depends on the bridge-os MPR run — staleness
there is expected until that refresh is wired (ASR-002/007).

## Honesty gate — protocol

Design: [`docs/architecture/specs/aaas-honesty-gate-design.md`](../../architecture/specs/aaas-honesty-gate-design.md).

Every audit must earn its score against the canon capability registry. The
producer emits `audit/evidence/aaas-honesty-coverage.json`
(`gtcx://fabric-os/aaas-honesty-coverage/v1`) with one entry per capability in
`machine/canon/registry.json`. Each entry carries `deepestRouteChecked` (a real
path one level **past** `entryRoute` — never equal to it), `veracity`
(`real | fixture | fabricated`), `disclosed`, `score`, and `worstFinding`.

The gate **fails the audit** when any of:

| Gate                      | Fails when                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- |
| `coverageComplete`        | a registry capability has no coverage entry — "scored the folders"               |
| `depthVerified`           | `deepestRouteChecked` is missing or equals `entryRoute` — "never opened `/[id]`" |
| `veracityDisclosed`       | a `fixture`/`fabricated` surface has `disclosed: false` — the fabrication bug    |
| `contradictionReconciled` | composite ≥ 85 while a covered capability scores < 60 and no cap fired           |
| `registryNonEmpty`        | the registry has zero capabilities                                               |

`registryAuthoritative` is reported; `--strict-registry` fails a draft registry
claimed 100% covered. The witness leads with `worstVerifiedFinding`, not a score.

## Rules

- Fabric OS consumes Bridge OS five-core probes instead of duplicating the fleet
  audit framework. The honesty gate is a thin layer over those witnesses + the
  canon registry; it owns no scoring engine.
- Audit evidence must be machine-readable and traceable to the lane register.
- The honesty gate is **surfaced, non-blocking** while the canon registry is
  `draft`; it becomes a hard CI block once the registry is populated (tracked in
  `machine/aaas-roadmap.json`).
- Human or vendor audit artifacts remain parallel gates unless an owner repo
  harness explicitly requires them.
