---
title: 'Audit as a Service'
status: current
date: 2026-06-30
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'aaas', 'audit', 'fabric']
review_cycle: on-change
---

# Audit as a Service

Fabric OS owns Audit-as-a-Service (AaaS): the fleet audit orchestration lane that
provisions audit contracts, delegates MPR scoring to Bridge OS, evaluates SIGNAL,
enforces cadence/ownership/honesty, and produces dated reports plus
machine-readable evidence. AaaS supplies the evidence that GTCX QAP consumes for
repository quality acceptance.

## System of Record

| Artifact             | Path                                                | Role                                              |
| -------------------- | --------------------------------------------------- | ------------------------------------------------- |
| AaaS contract        | `machine/spec/aaas-audit-contract.json`             | Fabric-owned service contract                     |
| MPR taxonomy         | `machine/spec/aaas-audit-taxonomy.json`             | 11-pillar MPR taxonomy and report map            |
| Command surface      | `machine/spec/aaas-command-surface.json`            | Canonical AaaS/QAP command vocabulary            |
| Fleet bindings       | `machine/fleet-audit-contracts.json`                | Repo-to-profile binding for provisioning         |
| Repo pin             | `machine/spec/aaas-audit-contract.pin.json`         | Thin consumer pin written into each repo          |
| MPR engine           | `bridge-os/platform/scripts/ecosystem/run-mpr-repo-audit.mjs` | Bridge-owned scorer delegated by Fabric |
| MPR witness          | `audit/evidence/mpr-repo-latest.json`               | Target-repo MPR composite witness                 |
| SIGNAL witness       | `audit/evidence/signal-maturity-latest.json`        | Target-repo SIGNAL maturity witness               |
| Honesty witness      | `audit/evidence/aaas-honesty-gate-latest.json`      | Anti-superficiality validator                     |
| Ownership witness    | `audit/evidence/aaas-ownership-latest.json`         | Owner/SLA/escalation proof                        |
| Cadence witness      | `audit/evidence/aaas-cadence-latest.json`           | Freshness heartbeat                               |
| QAP contract         | `machine/spec/gtcx-qap-contract.json`               | Repository quality acceptance contract            |
| QAP witness          | `audit/evidence/repo-cleanup-mpr-signal-acceptance-latest.json` | Final repository quality decision      |

## Commands

```bash
pnpm aaas:provision             # dry-run contract folders + pins
pnpm aaas:provision:write       # write required folders + repo pins
pnpm aaas:audit -- --repo <repo> --lens mpr --write
pnpm aaas:audit -- --repo <repo> --lens signal --write
pnpm aaas:audit -- --repo <repo> --lens all --write
pnpm aaas:contract:check
pnpm aaas:contract:check:write
pnpm aaas:friction:check
pnpm aaas:friction:check:write
pnpm aaas:honesty:check          # reject "scored the map, not the territory"
pnpm aaas:honesty:check:write
pnpm aaas:cadence                # report witness freshness (ASR-007)
pnpm aaas:cadence:write          # refresh friction + honesty witnesses, then check
pnpm qap:repo:acceptance         # final GTCX QAP acceptance gate
pnpm qap:repo:acceptance:write
```

## How AaaS/MPR Is Saved And Provisioned

AaaS is saved through a Fabric contract and repo-local evidence, not by copying
audit logic into every repo.

1. `machine/spec/aaas-audit-contract.json` defines required folders, artifact
   vocabulary, ownership, cadence SLA, and witness schemas.
2. `machine/spec/aaas-audit-taxonomy.json` defines the MPR two-tier, 11-pillar,
   micro-audit taxonomy.
3. `machine/fleet-audit-contracts.json` binds each repo to an audit profile.
4. `pnpm aaas:provision:write` creates `audit/evidence`, `audit/reports`,
   `audit/handoff`, `audit/archive`, and `reports`, then writes
   `machine/spec/aaas-audit-contract.pin.json` in the target repo.
5. `pnpm aaas:audit -- --repo <repo> --lens mpr --write` delegates to the
   Bridge MPR engine and writes `audit/evidence/mpr-repo-latest.json` plus
   pillar evidence in the target repo.
6. Fabric writes AaaS control witnesses under `audit/evidence/`, including
   contract, cadence, honesty, ownership, handoff, and report witnesses.
7. Dated human-readable assessments live in `audit/reports/`; work-order
   handoffs live in `audit/handoff/`; remediation records live in `reports/`;
   superseded dated artifacts move to `audit/archive/`.
8. `pnpm qap:repo:acceptance` consumes the saved AaaS/MPR/SIGNAL/governance
   witnesses and returns the repository quality acceptance decision.

## Cadence

`platform/scripts/aaas-cadence.mjs` is the assurance heartbeat. `:write` refreshes
the friction + honesty witnesses, then asserts the monitored witnesses
(`aaas-friction-check`, `aaas-honesty-gate`, MPR/SIGNAL, and contract evidence)
are within the configured freshness window. An undateable witness is treated as
not-verifiable and fails under strict mode. Witness:
`audit/evidence/aaas-cadence-latest.json`.

## Honesty gate — protocol

Design: [`docs/architecture/aaas-honesty-gate-design.md`](../../architecture/aaas-honesty-gate-design.md).

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

- Fabric OS consumes the Bridge OS MPR engine instead of duplicating the scoring
  framework. The honesty gate is a thin layer over those witnesses and the canon
  registry; it owns no scoring engine.
- Audit evidence must be machine-readable and traceable to the lane register.
- The honesty gate is **surfaced, non-blocking** while the canon registry is
  `draft`; it becomes a hard CI block once the registry is populated (tracked in
  `machine/aaas-roadmap.json`).
- Human or vendor audit artifacts remain parallel gates unless an owner repo
  harness explicitly requires them.
- GTCX QAP is the acceptance layer; it must consume AaaS/MPR/SIGNAL evidence
  rather than inventing alternate scoring or repo-local shortcuts.
