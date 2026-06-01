---
title: 'Inbound — gtcx-protocols P0 unblock (INF-49 / HSM)'
status: current
date: '2026-06-01'
owner: platform-lead
tier: critical
tags: ['gtm', 'inbound', 'protocols', 'tradepass', 'inf-49', 'hsm']
review_cycle: on-change
---

# Inbound — gtcx-protocols P0 unblock (2026-06-01)

Cross-repo paper trail for the coordination request on **gtcx-protocols#60** (DIDs resolvable) and **#61** (production issuers). Symmetric to [`gtcx-protocols/docs/gtm/inbound-tickets/from-gtcx-mobile-2026-05-24.md`](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/gtm/inbound-tickets/from-gtcx-mobile-2026-05-24.md).

## Request summary (from protocols)

| Need                                                          | Infra tracker  | Protocols tracker |
| ------------------------------------------------------------- | -------------- | ----------------- |
| Staging/production URL + TLS for authority DID JSON-LDs       | **#49**        | **#60**           |
| HSM provisioning + production key ceremony                    | **#86**        | **#61**           |
| Rotate `publicKeyMultibase` + `gtcx.key_status: "production"` | After ceremony | **#61**           |

**Clarification:** In this repo, GitHub **#50–#54** are **mobile audit-path** deploy stories (bundles, replay, query), **not** HSM. Do not use `#49–#54` as an HSM range when commenting cross-repo.

## Unblock chain

```
INF-49 (DNS/TLS + /health 200)
  → gtcx-protocols#60 (GET /v1/dids/auth/<iso>/<slug> handler)
    → INF-86 (HSM ceremony + KMS keys)
      → gtcx-protocols#61 (key_status: production)
        → gtcx-mobile (real issuer registration)
```

## Infra status (2026-06-01)

### #49 — Staging DNS + TLS

| Item                                            | Status                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| IaC (Route53 module, staging ingress hostnames) | **Merged** — PR #66                                                                                             |
| Runbook                                         | [`docs/operations/runbooks/inf-49-staging-dns.md`](../../operations/runbooks/inf-49-staging-dns.md)             |
| DNS `api.staging.gtcx.trade`                    | **Resolves** to ALB (af-south-1)                                                                                |
| `curl https://api.staging.gtcx.trade/health`    | **403** (ALB reachable; backend/routing fix in progress)                                                        |
| Evidence                                        | [`docs/audit/inf-49-staging-dns-evidence-2026-06-01.md`](../../audit/inf-49-staging-dns-evidence-2026-06-01.md) |

**ETA to close #49:** 3–5 business days (target group / ingress path to compliance-gateway or protocols staging service returning 200 on `/health`).

### #86 — Authority HSM ceremony

| Item                                     | Status                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| KMS signing Terraform module             | Present — `infra/terraform/modules/kms-signing/`                                  |
| Ceremony runbook                         | [`docs/security/key-ceremony-runbook.md`](../../security/key-ceremony-runbook.md) |
| Scheduled ceremony for 43 authority DIDs | **Not started** — needs dual custodians + `GTCX-KEY-CEREMONY` approval            |

**ETA:** 4–8 weeks after leadership sign-off (parallel to staging DID resolution with placeholders).

### Protocols-owned (not infra)

- HTTP handler: `GET /v1/dids/auth/<iso>/<slug>` → `country-support-packages/*/authorities/*.json`
- CSP artifacts + `key_status: "placeholder"` (already emitted per protocols Sprint 11)

## Outbound responses posted

| When       | Where                  | Link                       |
| ---------- | ---------------------- | -------------------------- |
| 2026-06-01 | gtcx-protocols#60      | (see GitHub issue comment) |
| 2026-06-01 | gtcx-protocols#61      | (see GitHub issue comment) |
| 2026-06-01 | gtcx-infrastructure#49 | status comment             |

## References

- [`country-support-packages/_tools/AUTHORITIES-README.md`](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/country-support-packages/_tools/AUTHORITIES-README.md)
- Audit finding: **MA-2026-05-31-003** (protocols — flip `key_status` after infra evidence)
- Mobile CERT pins: `gtcx-mobile/apps/mobile/gtcx/CERT_PINS.md` (SPKI after #49 TLS stable)
