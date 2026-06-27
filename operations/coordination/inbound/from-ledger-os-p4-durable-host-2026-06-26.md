---
title: 'Inbound: ledger-os P4 durable host (STORY-G4-2) — recheck 2026-06-27'
status: current
date: 2026-06-27
owner: fabric-os
source_repo: ledger-os
tier: operating
document_type: inbound-handoff
tags: ['coordination', 'p4', 'ledger-os', 'durable-host', 'infra', 'cloudflare']
review_cycle: on-change
---

# Inbound: ledger-os P4 durable host (STORY-G4-2)

**Source:** ledger-os `docs/operations/coordination/p4-external-owner-handoffs.md`  
**Story:** STORY-G4-2 — Promote staging to durable host  
**Blocked on:** fabric-os / ops (Cloudflare origin/TLS configuration)  
**Class:** A  
**blocksIR:** false

## What ledger-os delivered

- Named tunnel config: `ledger-os/deploy/staging/cloudflared-named-tunnel.example.yml`
- Promotion + health runbook: `ledger-os/docs/operations/runbooks/durable-host-promotion.md`
- Durable host profile slot: `ledger-os/docs/operations/deployment/deployment-profile.json` (`durableHost.url` = `https://ledger.gtcx.trade`)
- Health endpoint validated locally: `GET /api/health`
- Local HTTP route audit PASS: `ledger-os/audit/evidence/route-audit-latest.json`
- Corridor witness scaffold: `ledger-os/audit/evidence/ledger-corridor-witness-latest.json`
- Mirrored audit response: `audit/independent/ledger-os/feedback/audit-response-2026-06-27.md`

## Recheck result (2026-06-27)

Durable-host HTTP route audit **still FAIL**; Cloudflare returns **525 SSL handshake failed** for every probed route.

Evidence:

- `ledger-os/audit/evidence/route-audit-durable-host-2026-06-27.json`
- `ledger-os/audit/evidence/route-audit-durable-host-recheck-2026-06-27.json` (all HTTP probes `status: 525`)
- `ledger-os/audit/evidence/ledger-corridor-witness-latest.json`

```text
ledger.gtcx.trade: provisioned
ops:institutional-check: PASS
durable HTTP audit: FAIL
recheck result: FAIL, Cloudflare 525 on all routes
owner: ops
next: fix Cloudflare/origin TLS handshake or tunnel origin binding
```

## Root cause (most likely)

Cloudflare is attempting HTTPS origin negotiation, but the origin is either HTTP-only, has no valid origin certificate, or is not the service `cloudflared` is forwarding to.

## Fix checklist for ops / fabric-os

1. **Inspect tunnel config** at `ledger-os/deploy/staging/cloudflared-named-tunnel.example.yml`.
2. **Verify origin app reachable from the tunnel host:**
   ```bash
   curl -I http://localhost:3400/api/health
   ```
3. **Point ingress to the HTTP origin** (if origin serves HTTP):
   ```yaml
   ingress:
     - hostname: ledger.gtcx.trade
       service: http://localhost:3400
     - service: http_status:404
   ```
   Only use `https://localhost:3400` if the origin really serves HTTPS with a valid cert.
4. **Restart the tunnel:**
   ```bash
   cloudflared tunnel run <tunnel-name>
   ```
5. **Re-test from outside:**
   ```bash
   curl -I https://ledger.gtcx.trade/api/health
   ```
6. **If using Cloudflare proxy DNS instead of Tunnel**, set Cloudflare SSL mode to match the origin:
   - HTTP-only origin → use Tunnel or Flexible
   - HTTPS origin → install Cloudflare Origin Certificate and use Full Strict

## Re-run ledger-os acceptance audit

Once the above is green:

```bash
cd ledger-os
LEDGER_OS_BASE_URL=https://ledger.gtcx.trade \
  LEDGER_OS_TENANT_PROFILE=sis-inspections \
  LEDGER_OS_ROUTE_AUDIT_HTTP=1 \
  LEDGER_OS_ROUTE_AUDIT_WARM_MS=3000 \
  pnpm routes:audit:http
```

## Acceptance / closure

1. `https://ledger.gtcx.trade/api/health` returns 200.
2. `LEDGER_OS_BASE_URL=https://ledger.gtcx.trade pnpm routes:audit:http` passes.
3. `ledger-os/audit/evidence/route-audit-latest.json` records `ok: true` with `baseUrl: "https://ledger.gtcx.trade"`.
4. `ledger-os/audit/evidence/ledger-corridor-witness-latest.json` updated with durable-host route evidence.
5. M2M token rotated and revalidated for durable host.
6. SIS adoption and webhook settings updated to use live host.

## Credential status

Cloudflare credentials are **not present** in the current agent shell:

- `CLOUDFLARE_API_TOKEN` = MISSING
- `CLOUDFLARE_ZONE_ID` = MISSING
- `CLOUDFLARE_ACCOUNT_ID` = MISSING

Operator must run the provisioning script (`deploy/infra/provision-cloudflare-tunnel.mjs`) from a shell or CI context that has these secrets.

## Fleet blocker linkage

- Fabric-os blocker ID: **FB-016**
- Canonical state: `operations/coordination/fleet-blocker-state.json`
- Target date: **2026-06-28** for TLS/origin health fix or explicit revised ETA.
