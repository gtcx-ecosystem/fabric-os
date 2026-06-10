---
title: Execution roadmap — DevOps-as-a-Service
status: current
date: 2026-06-10
last_reconciled: 2026-06-10T04:19:25.354Z
owner: gtcx-infrastructure
program: INIT-GTCX-INFRA-DAAS
generated: true
generated_by: platform/scripts/generate-execution-roadmap.mjs
sources:
  - pm/daas-roadmap.json
  - pm/friction-register.json
  - pm/daas-stories.json
  - audit/evidence/daas-friction-check-latest.json
  - audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json
---

# gtcx-infrastructure execution roadmap

> **Generated file.** Edit `pm/daas-stories.json`, `pm/friction-register.json`, or
> `pm/daas-roadmap.json`, then run `pnpm generate:roadmap`.

**Primary program:** DevOps-as-a-Service (DaaS) — not product ECO sprints.

## Active Phase: DAAS-S3 — Cost witness + env schedule automation

**Status:** `in_progress`

**Live probe:** AGX `api/health` → **200** (fleet witness 2026-06-10).

| Story      | Title                                                      | Priority | Status      | Owner               |
| ---------- | ---------------------------------------------------------- | -------- | ----------- | ------------------- |
| DAAS-S3-01 | Compliance-os GHCR imagePullSecrets on all app deployments | P1       | in_progress | gtcx-infrastructure |
| DAAS-S3-02 | Intelligence staging image with ENABLE_COST_ROUTER         | P1       | pending     | gtcx-infrastructure |

### DAAS-S3-01: Compliance-os GHCR imagePullSecrets on all app deployments

**Files:** deploy/kubernetes/overlays/staging/compliance-os/external-secrets.yaml, docs/operations/daas/cards/compliance-os.md

**Acceptance**

```bash
kubectl get externalsecret -n compliance-os-staging
pnpm --dir ../compliance-os w2:staging-prereq-check
```

**UAT / QA**

- [x] compliance-os-ghcr-pull SecretSynced True
- [x] staging-web-app 1/1 Running
- [ ] All GHCR app deployments reference imagePullSecrets

**Blockers:** compliance-api/caas/core12/via/vxa deployments missing imagePullSecrets

### DAAS-S3-02: Intelligence staging image with ENABLE_COST_ROUTER

**Files:** deploy/kubernetes/overlays/staging/, docs/operations/coordination/infra-per-repo-action-matrix-2026-06-05.md

**Acceptance**

```bash
pnpm daas:fleet:health
```

**UAT / QA**

- [ ] gtcx-intelligence staging pod Running with cost router enabled
- [ ] Cost witness evidence published

**Blockers:** none

## Future Phases

| Sprint  | Goal                                         | Status   | Owner               | Stories / Friction |
| ------- | -------------------------------------------- | -------- | ------------------- | ------------------ |
| DAAS-S1 | Friction register + fleet health witness     | complete | gtcx-infrastructure |                    |
| DAAS-S2 | Per-repo DaaS cards + ingress matrix publish | complete | gtcx-infrastructure |                    |

## Issue Reconciliation

| Issue                        | Source                      | Roadmap Mapping | Status            |
| ---------------------------- | --------------------------- | --------------- | ----------------- |
| `F-AGX-01`                   | `pm/friction-register.json` | DAAS-S1-03      | done              |
| `XR-MKT-011`                 | `pm/friction-register.json` | DAAS-S1-04      | done              |
| `F1`                         | `pm/friction-register.json` | DAAS-S2-01      | done              |
| `F2`                         | `pm/friction-register.json` | DAAS-S3-01      | in_progress       |
| `F6`                         | `pm/friction-register.json` | DAAS-S3-02      | pending           |
| P41 hub protocol publication | `pm/_tasks`                 | gtcx-docs       | done (`a34baa8a`) |

## Unblock Order

1. **`F2`** (compliance-os) — GHCR imagePullSecret staging
2. **`F6`** (gtcx-intelligence) — Intelligence staging image with ENABLE_COST_ROUTER
