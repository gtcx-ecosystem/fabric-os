---
title: 'Outbound — ExplorationOS W2 + verifier dependencies resolved/tracked'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
from: gtcx-infrastructure
to: exploration-os
priority: P1
work_ids: [XR-507, XR-508, XR-502, W2-E2E]
---

# Outbound: ExplorationOS dependency resolution (gtcx-infrastructure)

**Reply to:** Hub P1 items #15–18 and `from-gtcx-protocols-cross-repo-unblock-2026-06-03.md`

---

## Dependency matrix

| Hub # | Work ID     | What exploration-os needs            | Infra status                  | Blocker                     | Next action             |
| ----- | ----------- | ------------------------------------ | ----------------------------- | --------------------------- | ----------------------- |
| 15    | XR-EO-003   | F-51 lender webhook deploy + secrets | **Not infra-owned**           | TBD ops                     | Escalate to ops owner   |
| 16    | XR-EO-004   | TerraOS live permit adapters         | **Not infra-owned**           | terra-os deferred           | Escalate to terra-os    |
| 17    | W2 prod E2E | Bearer + secrets + receiver          | **READY** — see details below | None on infra               | ExplorationOS runs E2E  |
| 18    | W2-C03      | Postgres persistence proof           | **Not infra-owned**           | terminal-os / prod ops      | Escalate to terminal-os |
| —     | XR-507      | SIR verifier DNS                     | **BLOCKED**                   | CF `zone:write` token       | Escalate to CF admin    |
| —     | XR-508      | Supabase prod migrations             | **BLOCKED**                   | Project paused in dashboard | Escalate to ops         |

---

## W2 prod E2E — infra readiness (item #17)

### Bearer token infrastructure

| Component                         | Status     | Evidence                                                              |
| --------------------------------- | ---------- | --------------------------------------------------------------------- |
| Compliance-gateway K8s deployment | ✅ Running | `compliance-gateway-staging` pod 1/1 in `gtcx-staging`                |
| Bearer auth middleware            | ✅ Live    | `tools/compliance-gateway/src/auth.mjs` — constant-time compare, IRSA |
| Ingress route (`/audit`)          | ✅ Live    | `geotag.staging.gtcx.trade/audit` → compliance-gateway:8500           |

### Secrets

| Secret                         | Location                                 | Status                                                                |
| ------------------------------ | ---------------------------------------- | --------------------------------------------------------------------- |
| `COMPLIANCE_OS_INTAKE_API_KEY` | AWS SM + ESO                             | **Ready to seal** — infra action on inbound ticket from compliance-os |
| `TRADEPASS_JWT_SECRET`         | AWS SM `gtcx-secrets-staging-cdkk972mcc` | ✅ Live in staging pods                                               |
| `SECRET_KEY_BASE`              | AWS SM `gtcx-secrets-staging-cdkk972mcc` | ✅ Live in staging pods                                               |

### Receiver infrastructure

| Component                           | Status   |
| ----------------------------------- | -------- |
| K8s namespace (`gtcx-staging`)      | ✅ Ready |
| Service mesh (Linkerd)              | ✅ Ready |
| WAF (`gtcx-staging-waf-af-south-1`) | ✅ Ready |
| RDS Postgres (`gtcx_staging`)       | ✅ Ready |

**Conclusion:** Infra has no blockers for W2 prod E2E. The compliance-gateway receiver is deployed, secrets are live, and the database is up. ExplorationOS can proceed with E2E testing.

---

## Blocked on external (infra cannot advance)

### XR-507 — SIR verifier DNS

- **Status:** Blocked
- **Blocker:** Cloudflare OAuth token lacks `zone:write`
- **Impact:** F-33 audit close; XR-008 re-audit
- **Evidence:** `https://4d98ac1c.exploration-os-verifier.pages.dev/sir` → 308 (Pages functional, custom domain missing)
- **Escalation path:** CF admin → add `zone:write` to token or manually create CNAME

### XR-508 — Supabase prod migrations

- **Status:** Blocked
- **Blocker:** Project `lolfkclpuvccntgtzwaj` paused in Supabase dashboard
- **Impact:** Financing prod path; `financing_applications` table
- **Evidence:** Migrations `006_financing_applications.sql` + `007_financing_lender_webhook.sql` ready
- **Escalation path:** Ops admin → unpause project in Supabase dashboard

---

## What exploration-os should do next

1. **W2 E2E:** Run end-to-end flow against `geotag.staging.gtcx.trade/audit` or compliance-gateway ClusterIP. Bearer tokens available via `gtcx-secrets-staging`.
2. **Verifier DNS:** Escalate CF `zone:write` to whoever owns the Cloudflare `gtcx.trade` zone.
3. **Supabase:** Escalate project unpause to ops/whoever has Supabase dashboard access.

---

## Cross-references

- Hub P1 register: `gtcx-docs/docs/governance/.../hub-p1-register.md`
- Protocols unblock doc: `gtcx-protocols/docs/operations/coordination/from-gtcx-protocols-cross-repo-unblock-2026-06-03.md`
- Infra remaining work: `gtcx-infrastructure/docs/operations/coordination/remaining-cross-repo-work-2026-06-03.md`
- Sprint workplan: `gtcx-infrastructure/docs/operations/coordination/cross-repo-sprint-workplan-2026-06.md`
