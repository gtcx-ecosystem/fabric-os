---
title: SECaaS card — terminal-os
status: current
date: 2026-06-14
owner: fabric-os
---

# SECaaS card — terminal-os

**Lane:** **L4a** · **deployProduct:** **GTCX Cloud** (Terminal)  
**Friction:** `W2-OPS-001` (resolved 2026-06-04) · **DaaS overlap:** terminal-os staging EKS deploy

## Stack security actions (fabric-os)

1. Staging secrets via ESO from AWS SM — no plaintext in manifests
2. Cloudflare DNS + ACM TLS for `terminal-staging.gtcx.trade`
3. ALB ingress health checks on `/api/health`; `/api/ready` 403 from WAF is expected (external APIs degraded)
4. AMD64 image builds for EKS t3.medium nodes (ARM64 build rejected)
5. Pen-test scope includes terminal-staging public surface

## Product handoff

Runtime secret, staging auth, or ingress failures → `to-fabric-os-terminal-*.md`

## Re-probe

```bash
curl -sS https://terminal-staging.gtcx.trade/api/health
```

After infra seal: `pnpm --dir ../terminal-os workflow:staging-receiver-smoke`
