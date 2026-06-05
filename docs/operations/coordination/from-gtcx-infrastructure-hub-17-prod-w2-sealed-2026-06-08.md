---
title: 'Witness — Hub #17 prod W2 sealed + ingress live'
status: complete
date: 2026-06-08
owner: gtcx-infrastructure
hub_blocker: 17
er1: ER-1-10
authority_class: A
---

# Witness — Hub #17 prod W2 sealed + ingress live

## Summary

Prod W2 secrets, ESO, web-app, ALB ingress, ACM `*.gtcx.trade`, and Cloudflare CNAME are **live**. Public intake **201**; exploration retest **PASS**.

## Evidence

| Check                                 | Result                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------- |
| SM `gtcx/compliance-os/production/w2` | 7 keys                                                                     |
| ESO `compliance-os-w2-secrets`        | Ready                                                                      |
| `web-app` pods                        | 2/2 Running                                                                |
| ALB                                   | `k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com` |
| ACM                                   | `eefdabd1` — `gtcx.trade` + `*.gtcx.trade` **ISSUED**                      |
| Cloudflare CNAME                      | `compliance.gtcx.trade` → ALB (DNS only)                                   |
| `curl https://compliance.gtcx.trade/` | **307**                                                                    |
| Intake POST                           | **201**                                                                    |
| exploration `w2:prod:retest`          | **PASS** — `w2-hub-17-retest-latest.json` `ok: true`, status **201**       |

## Remaining (sibling Class R)

| #   | Owner         | Item                                                   |
| --- | ------------- | ------------------------------------------------------ |
| 3   | compliance-os | `pnpm w2:terminal-patch-proof` (prod terminal URL/key) |
| 4   | terminal-os   | Re-smoke if prod terminal URL changes                  |

Hub **#17** close pending compliance-os PATCH 2xx + baseline-os locker finalize.
