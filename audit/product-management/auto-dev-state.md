---
title: DaaS auto-development state
status: current
date: 2026-06-10
owner: gtcx-infrastructure
---

# Auto-Development State

## Active Phase

- **ID:** DAAS-S1
- **Status:** blocked
- **Reason:** XR-MKT-011 ingress + URL matrix delivered (partial). AGX image build still fails —
  platforms `docker:push:agx:staging` needs monorepo lockfile in build context (`pnpm-lock.yaml`).

## Next Work

- **Owner:** `gtcx-os/platforms`
- **Action:** Fix Dockerfile build context (monorepo `pnpm-lock.yaml` + `turbo.json`); publish
  `gtcx-agx:staging` with `@gtcx/platform-shared`; notify infra for rollout.
- **Owner (infra):** Roll out new digest after push; re-run `pnpm daas:fleet:health`.

## Evidence

- `audit/evidence/daas-friction-check-latest.json` — structural gate passed.
- `audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json` — live AGX health `503`.
- `docs/operations/coordination/from-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md`
  — partial seal and owner split.
