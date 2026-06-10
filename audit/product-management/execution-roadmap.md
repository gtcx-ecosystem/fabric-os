---
title: Execution roadmap — DevOps-as-a-Service
status: current
date: 2026-06-10
last_reconciled: 2026-06-10
owner: gtcx-infrastructure
program: INIT-GTCX-INFRA-DAAS
sources:
  - pm/daas-roadmap.json
  - pm/friction-register.json
  - audit/evidence/daas-friction-check-latest.json
  - audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json
  - docs/operations/coordination/from-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md
  - ../gtcx-markets/docs/operations/coordination/to-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md
---

# gtcx-infrastructure execution roadmap

**Primary program:** DevOps-as-a-Service (DaaS) — not product ECO sprints.

## Active Phase: DAAS-S1 — P0 Friction And Fleet Health

**Status:** `blocked`

The repository-owned harness and fleet witness are complete. The remaining P0 outcomes share one
supplier dependency: a corrected `gtcx-agx:staging` image containing `@gtcx/platform-shared`.

| Story | Title | Priority | Status | Owner |
| --- | --- | --- | --- | --- |
| DAAS-S1-01 | DaaS friction register structural witness | P0 | done | gtcx-infrastructure |
| DAAS-S1-02 | Canonical scheduled fleet-health witness | P0 | done | gtcx-infrastructure |
| DAAS-S1-03 | Correct AGX staging image and health | P0 | blocked | gtcx-os/platforms → gtcx-infrastructure |
| DAAS-S1-04 | Deliver XR-MKT-011 authority routes and trace seal | P0 | blocked | gtcx-infrastructure → gtcx-markets |

### DAAS-S1-01: DaaS Friction Register Structural Witness

**Files:** `pm/friction-register.json`, `pm/daas-roadmap.json`,
`audit/evidence/daas-friction-check-latest.json`

**Acceptance**

```bash
pnpm daas:friction:check:write
```

**UAT / QA**

- [x] Structural DaaS gate passed on 2026-06-10.
- [x] Evidence records two open P0 items: `F-AGX-01`, `XR-MKT-011`.

**Blockers:** none

### DAAS-S1-02: Canonical Scheduled Fleet-Health Witness

**Files:** `package.json`, `platform/tools/scripts/cross-repo-health-probe.mjs`,
`.github/workflows/cross-repo-health.yml`,
`audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json`

**Acceptance**

```bash
pnpm daas:fleet:health
pnpm ops:check
```

**UAT / QA**

- [x] Canonical `pnpm daas:fleet:health` command exists.
- [x] Scheduled workflow uses P35 paths.
- [x] Live witness ran on 2026-06-10 and wrote canonical evidence.
- [x] Probe failure is preserved as operational evidence, not treated as a harness failure.

**Blockers:** none

### DAAS-S1-03: Correct AGX Staging Image And Health

**Files:** supplier image in `gtcx-os/platforms`; infra rollout after digest publication

**Acceptance**

```bash
pnpm daas:fleet:health
```

**UAT / QA**

- [ ] `gtcx-agx:staging` contains `@gtcx/platform-shared`.
- [ ] `https://api.staging.gtcx.trade/api/health` returns `200`.

**Blockers:** `gtcx-os/platforms` must publish the corrected staging image. Live witness returned
AGX `503` on 2026-06-10.

### DAAS-S1-04: Deliver XR-MKT-011 Authority Routes And Trace Seal

**Files:** staging ingress/auth matrix, AWS Secrets Manager contract,
`docs/operations/coordination/from-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md`

**Acceptance**

```bash
pnpm daas:fleet:health
pnpm --dir ../gtcx-markets authority:trace:capture
```

**UAT / QA**

- [ ] AGX health returns `200`.
- [ ] Markets authority trace capture returns `7/7`, exit `0`.
- [ ] Infra seal status changes from `delivered-partial` to `delivered`.

**Blockers:** depends on `DAAS-S1-03`; current authority capture is `0/7`.

## Future Phases

| Sprint | Goal | Status | Owner | Stories / Friction |
| --- | --- | --- | --- | --- |
| DAAS-S2 | Terminal EKS, compliance GHCR, DaaS cards | pending | gtcx-infrastructure | `F1`, `F2` |
| DAAS-S3 | Intelligence cost-router image and cost witness | pending | gtcx-infrastructure | `F6` |

## Issue Reconciliation

| Issue | Source | Roadmap Mapping | Status |
| --- | --- | --- | --- |
| `F-AGX-01` | `pm/friction-register.json` | `DAAS-S1-03` | blocked |
| `XR-MKT-011` | `pm/friction-register.json` | `DAAS-S1-04` | blocked |
| `F1` | `pm/friction-register.json` | DAAS-S2 | pending |
| `F2` | `pm/friction-register.json` | DAAS-S2 | pending |
| `F6` | `pm/friction-register.json` | DAAS-S3 | pending |
| P41 hub protocol publication | `pm/_tasks` | deferred to `gtcx-docs` owner | blocked-sibling |

## Unblock Order

1. `gtcx-os/platforms`: publish corrected `gtcx-agx:staging` image.
2. `gtcx-infrastructure`: roll out digest, verify health `200`, and apply authority ingress/auth.
3. `gtcx-markets`: run `authority:trace:capture` and return `7/7` evidence.
