---
title: Fleet supply-chain CVE policy
status: current
date: 2026-06-14
owner: fabric-os
storyId: SECAS-S4-02
frictionId: SEC-SUPPLY-01
opsLane: SecOps
---

# Fleet supply-chain CVE policy

> **Machine policy:** `pm/spec/supply-chain-cve-policy.json`  
> **Harness:** `pnpm secas:supply-chain:check:write`  
> **Witness:** `audit/evidence/secas-supply-chain-check-latest.json`

## Severity tiers

| Tier         | Production tolerance | SLA | Action                                            |
| ------------ | -------------------- | --- | ------------------------------------------------- |
| **Critical** | 0                    | 24h | Block release; remediate or Class S accepted-risk |
| **High**     | 0                    | 72h | Block release; remediate or Class S accepted-risk |
| **Moderate** | Track                | 14d | Open `SEC-*` friction item if unresolved          |
| **Low**      | Track                | 30d | Weekly triage (SECAS-S4-03 cadence)               |

## Fleet rollup

Probe repos (minimum 4): **fabric-os**, **markets-os**, **compliance-os**, **terminal-os**.

Each repo must have:

1. `package.json` + `pnpm-lock.yaml` (deterministic install)
2. CI witness path referencing dependency audit and/or container scan (Trivy)
3. Rollup row in `secas-supply-chain-check-latest.json`

Local rollup command:

```bash
pnpm secas:supply-chain:check:write
```

When npm registry is unreachable, harness records `verdict: partial` and relies on CI witness + lockfile presence — not a release bypass.

## CI witness

| Repo          | Primary witness                                                      |
| ------------- | -------------------------------------------------------------------- |
| fabric-os     | `.github/workflows/ci.yml` — `audit-with-acceptance.mjs` + Trivy     |
| markets-os    | `.github/workflows/ci.yml` — `pnpm audit --audit-level high` + Trivy |
| compliance-os | `.github/workflows/ci.yml` — `pnpm audit` + Trivy SARIF              |
| terminal-os   | Fleet gate via fabric-os rollup; lockfile + validate ladder          |

## Accepted risk process

1. Document finding in `pm/security-friction-register.json` with owner + unblock action
2. Class **S** sign-off for critical/high production exceptions
3. Re-probe on closure: `pnpm secas:supply-chain:check:write`

## SLA

SecOps reviews fleet rollup **weekly** (aligned with SECAS-S4-03 vuln cadence). Critical/high findings escalate per [incident-response runbook](./runbooks/incident-response.md).
