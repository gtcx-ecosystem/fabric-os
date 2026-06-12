---
title: SECaaS card — markets-os
status: current
date: 2026-06-12
owner: fabric-os
---

# SECaaS card — markets-os

**Lane:** **L4b** · **deployProduct:** **GTCX Cloud** (AGX)  
**Friction:** `SEC-WAF-01` (closed) · **DaaS overlap:** `XR-MKT-011`

## Stack security actions (fabric-os)

1. WAF `AllowMarketsAuthorityEndpoints` — witness 7/7 authority trace
2. Ingress TLS + path rules per `xr-mkt-011-authority-url-matrix`
3. Pen-test scope **L4b only** — AGX staging at `api.staging.gtcx.trade` (`SEC-PENTEST-01`; distinct from L4a sovereign + T0 protocol API)

## Product handoff

Authority route or capture failures → `to-fabric-os-markets-authority-*.md`

## Re-probe

`pnpm --dir ../markets-os authority:trace:capture` after infra seal.
