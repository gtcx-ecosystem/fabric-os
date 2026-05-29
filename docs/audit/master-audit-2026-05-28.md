---
title: "GTCX Infrastructure — Master Audit"
status: "current"
date: "2026-05-28"
owner: "gtcx-infrastructure"
role: "quality-evidence-lead"
audit_type: master
target_repo: gtcx-infrastructure
audit_date: "2026-05-28"
composite: 7.4
composite_raw: 7.4
investor: 7.2
enterprise: 7.0
sov_dfi: 7.1
p0_count: 0
p1_count: 5
p2_count: 4
caps_fired: 0
---

# GTCX Infrastructure — Master Audit

**Date:** 2026-05-28 (delta audit)  
**Repo:** `gtcx-ecosystem/gtcx-infrastructure`  
**Auditor:** Cursor Agent (foundation audit session)  
**Methodology:** `gtcx-docs/docs/audit/prompts/forensic-master-prompt.md`  
**Prior master audit:** [master-audit-2026-05-27.md](master-audit-2026-05-27.md) (6.9/10 capped, raw 7.25)  
**Current HEAD:** `9b6ec604`  
**Working tree:** Dirty (docs, baseline memory, AGENTS.md)

---

## Executive Summary

| Dimension | Score | Band |
|-----------|------:|------|
| Core Weighted Score | **7.4/10** | credible beta → approaching production-capable |
| Investor Lens | 7.2/10 | credible beta |
| Enterprise Buyer Lens | 7.0/10 | credible beta |
| African Sovereign / DFI Lens | 7.1/10 | credible beta |

**Verdict:** **+0.5 composite improvement** since 2026-05-27. All four P0 deploy/CI blockers from the prior audit are **resolved** at HEAD: production Kustomize builds, `@gtcx/docs-site` builds, `@gtcx/replay-protection` lint passes, Terraform fmt passes. Remaining gaps are docs-standard violations (broken links), P1 security/ops items (PagerDuty key, audit endpoint rate limits, testnet WORM bucket), and external validation. **Cap lifted** — no longer capped at 6.9.

---

## Verification Commands

| Command | Result | Notes |
|---------|--------|-------|
| `pnpm build` | Pass | docs-site Starlight build succeeds |
| `pnpm lint` | Pass | replay-protection eslint clean |
| `pnpm test` (validate.sh quick) | **Fail** | 3 docs-standard violations |
| `kubectl kustomize overlays/production` | **Pass** | Was P0-001 failure |
| `kubectl kustomize overlays/pen-test` | **Pass** | Was P1-004 failure |
| `terraform fmt -check -recursive` | **Pass** | Was P0-004 failure |

### Docs-standard failures

1. `docs/README.md` → broken link `engineering/tech-stack/version-standards.md`
2. `docs/engineering/tech-stack/README.md` → broken link `./version-standards.md`
3. `docs/audit/vendor-outreach/` → missing README/index

---

## Findings

### Critical

None (all prior P0s resolved).

### High (P1)

**[P1] Hardcoded PagerDuty routing key** `infra/docker/observability/alertmanager.yml:180`  
Carried from 2026-05-27; gitleaks-detectable.

**[P1] Audit endpoints lack QPS budget** `tools/compliance-gateway/src/server.mjs`  
`/audit/bundles` and `/audit/query` do not call `checkBudget` unlike `/v1/query`.

**[P1] Testnet-pilot WORM bucket absent** AWS evidence  
Production and staging WORM buckets verified previously; testnet-pilot bucket not found.

**[P1] Docs-standard gate fails** `pnpm test`  
Broken links and missing vendor-outreach index block governance gate.

**[P1] Staging/testnet public health endpoints**  
Prior audit: ALB 403 on staging; testnet DNS unresolved — not re-verified with live credentials this session.

### Medium (P2)

**[P2] `docs/agile/sprints/current.md`** — may lack required frontmatter if committed  
**[P2] Astro dependency advisories** — 2 vulnerabilities in prior `pnpm audit`  
**[P2] Dirty working tree** — baseline/docs WIP  
**[P2] Overview doc freshness** — carried forward

### Resolved Since 2026-05-27

| ID | Finding | Resolution |
|----|---------|------------|
| P0-001 | Production Kustomize overlay | Builds at HEAD |
| P0-002 | docs-site build failure | Builds at HEAD |
| P0-003 | replay-protection lint | Passes |
| P0-004 | Terraform fmt | Passes |
| P1-004 | pen-test overlay namespace conflict | Builds at HEAD |

---

## Core Scorecard

| Dimension | Weight | Score | Confidence |
|-----------|-------:|------:|------------|
| Code Quality | 15 | 7.5 | B |
| Repo / Folder Hygiene | 10 | 7.2 | B |
| Security | 20 | 7.4 | B |
| Global South Resilience | 15 | 7.6 | B |
| Ecosystem Integration | 15 | 7.9 | B |
| Agentic Maturity | 10 | 8.0 | B |
| Enterprise / Production Readiness | 15 | 7.0 | B |

**Raw weighted:** 7.4/10 | **Caps fired:** 0

---

## Top 5 Remediation

| Priority | Item | Target |
|----------|------|--------|
| P1 | Rotate PagerDuty key to secret store; remove from alertmanager.yml | Immediate |
| P1 | Add `checkBudget` to audit ingestion/query routes | Sprint+1 |
| P1 | Fix docs-standard broken links + vendor-outreach index | Immediate |
| P1 | Provision testnet-pilot WORM bucket or update claims | M2 |
| P2 | Resolve Astro audit advisories | M2 |
