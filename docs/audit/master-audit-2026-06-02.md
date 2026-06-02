---
audit_type: master
target_repo: gtcx-infrastructure
audit_date: 2026-06-02
composite: 7.7
composite_raw: 7.7
investor: 7.8
enterprise: 7.4
sov_dfi: 6.8
p0_count: 1
p1_count: 3
caps_fired: 0
---

## Audit Metadata

- Repo: `gtcx-ecosystem/gtcx-infrastructure`
- Scope: single repo only (infra + tools + docs + CI/IaC). No sibling repos.
- Audit date: 2026-06-02
- Auditor: Cursor agent (GPT-5.2)
- Comparison baseline:
  - Latest full audit: `docs/audit/full-audit-2026-05-31.md` (HEAD `afce75a`)
  - Machine status: `docs/audit/latest.json` (IR/XC split, rubric v2)
  - Prior master-audit cluster: `docs/audit/master-audit-2026-05-30.md` (superseded per its own frontmatter)

## Evidence Reviewed

- Code paths:
  - `tools/compliance-gateway/src/server.mjs` (routing, health, audit endpoints)
  - `tools/scripts/empty-catch-check.mjs` (static validator)
  - `infra/kubernetes/overlays/staging/*` (ingress, patches, kustomize images)
  - `infra/terraform/modules/waf/main.tf` (staging WAF /health allow)
- Tests and gates:
  - `pnpm test` (quick) — PASS after remediation below
  - `node tools/scripts/validate-all.mjs` — PASS (38/38)
- Docs / runbooks:
  - `docs/README.md`, `docs/audit/execution-roadmap.md`, `docs/operations/runbooks/inf-49-staging-dns.md`
  - Cross-repo trust layer reference: `docs/reference/architecture/trust-layers-and-did-resolution.md`
- Runtime evidence (staging):
  - `/health` → 200 (bare curl after WAF rule)
  - `/v1/dids/auth/gh/bog` → `did:gtcx:auth:gh:bog` (with browser UA when needed)

## Pre-flight results (commands)

- `pnpm install` — PASS
- `pnpm typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm build` — PASS
- `pnpm test` — PASS **after** remediation in this session
- `node tools/scripts/validate-all.mjs` — PASS (38/38)
- Working tree: **dirty** (see P0)

## Findings

### Critical

- None observed in repo-controlled gates after remediation; see P0 for audit-integrity / workflow state.

### High

- **[P1] PRD-002 staging audit API is not production-verifiable yet (arch + routing + DID resolver contract gaps)**  
  Evidence (deploy scaffolding): `infra/kubernetes/overlays/staging/ingress.yaml` routes `/audit` to `compliance-gateway-staging:8500`; compliance-gateway handler expects a TradePass DID document shape with `verificationMethod[].publicKeyJwk`.  
  Risk: Mobile PRD-002 e2e (`GTCX_STAGING_AUDIT_URL`) can observe “route exists” but still fail signature verification until the DID resolver contract is aligned (TradePass `/identity/:did` vs protocols `/v1/tradepass/:did`).  
  Fix: Treat #50–#52 as two acceptance tiers:
  - Tier A: route exists (≠404) + schema validation + nonce gate
  - Tier B: real signature verify end-to-end (requires DID doc endpoint contract)

### Medium

- **[P0] Audit run produced remediation without committing (working tree dirty)**  
  Evidence: `git status --short` showed modified files under `docs/` and `tools/` after fixing docs-standard + validator failures.  
  Why it matters: Master-audit expects a reproducible baseline. A dirty tree makes evidence non-replayable unless changes are committed or reverted.  
  Fix: Either commit the remediation as a small docs/tools hygiene PR, or revert and re-run with clean tree.

- **[P1] Docs-standard regressions are easy to reintroduce without directory indexes**  
  Evidence: missing `README.md` in `docs/gtm/inbound-tickets/` and `docs/reference/architecture/` originally broke `pnpm test` docs-standard gate.  
  Fix: Keep index discipline; treat missing README/index as a gate-friendly “structural lint”.

- **[P1] “Empty catch” validator allowlist requires maintenance discipline**  
  Evidence: `tools/scripts/empty-catch-check.mjs` flagged a stale allowlist entry after remediation removed an empty catch site.  
  Fix: Keep allowlist entries minimal; prefer explicit warn logs over empty catches in runtime paths.

### Low

- **[P2] Overview doc was stale (last updated 2026-05-27, score claim 9.0/10)**  
  Fix: Update `docs/overview/README.md` on each master-audit with links to `latest.json` and current audit artifacts.

## Core Scorecard

| Dimension                         | Weight | Score | Confidence | Notes                                                                                      |
| --------------------------------- | -----: | ----: | ---------- | ------------------------------------------------------------------------------------------ |
| Code Quality                      |     15 |   8.0 | A          | Typecheck/lint/test/build pass; coverage + validators enforced via `validate-all`          |
| Repo / Folder Hygiene             |     10 |   8.2 | B          | Docs-standard gate is strong; hygiene drift still possible (index discipline)              |
| Security                          |     20 |   8.6 | B          | Strong static validators + fail-closed patterns; external pen-test still separate track    |
| Global South Resilience           |     15 |   6.8 | B          | Replay protection + low-bandwidth tooling exists; some staging paths still WAF-sensitive   |
| Ecosystem Integration             |     15 |   7.0 | B          | Proven cross-repo unblock work (INF-49/#60); PRD-002 audit path still incomplete           |
| Agentic Maturity                  |     10 |   8.0 | B          | Strong gates + policy checks; agent safety docs in place                                   |
| Enterprise / Production Readiness |     15 |   6.9 | B          | IaC mature; production sovereign keys (#86/#61) and PRD-002 audit route remain open tracks |

### Core Weighted Score

- Raw weighted score: **7.7**
- Applied caps: **none**
- Final core score: **7.7**

## Lens Scores

### Investor / Sequoia-Style

| Area                           | Weight | Score | Notes                                                  |
| ------------------------------ | -----: | ----: | ------------------------------------------------------ |
| Technical Differentiation      |     25 |   7.8 | Strong governance validators; infra-as-product posture |
| Execution Credibility          |     25 |   7.8 | Recent staging unblock work demonstrates ship velocity |
| Ecosystem Leverage             |     20 |   7.6 | Cross-repo enablement (DID resolution) is concrete     |
| Commercialization Readiness    |     15 |   7.0 | External keys + PRD-002 still open                     |
| Platform Compounding Potential |     15 |   8.2 | Central gates and shared tooling compound across repos |

- Final investor lens score: **7.8**

### Enterprise Buyer

| Area                           | Weight | Score | Notes                                                                         |
| ------------------------------ | -----: | ----: | ----------------------------------------------------------------------------- |
| Control Environment            |     25 |   7.6 | Strong IaC + policy checks; staged evidence improving                         |
| Security and Auditability      |     25 |   7.8 | Audit-signer, WORM modules, validators; pen-test still external               |
| Integration Reliability        |     20 |   7.0 | PRD-002 audit path + identity contract not yet “green”                        |
| Operability and Supportability |     15 |   7.2 | Runbooks exist; staging WAF tuning landed for /health                         |
| Deployment Readiness           |     15 |   7.2 | Build gates strong; still some manual steps for staging/production ceremonies |

- Final enterprise buyer lens score: **7.4**

### African Sovereign / DFI

| Area                           | Weight | Score | Notes                                                                  |
| ------------------------------ | -----: | ----: | ---------------------------------------------------------------------- |
| Mission and Regional Fit       |     15 |   7.5 | Clear Africa-first posture in infra choices (af-south-1)               |
| Global South Resilience        |     25 |   6.8 | Replay protection strong; remaining WAF/UA friction on some paths      |
| Governance and Trust           |     25 |   6.6 | Sovereign authority keys still placeholder pending #86 ceremony        |
| Institutional Interoperability |     15 |   6.8 | Strong docs + runbooks; production key provenance still pending        |
| Long-Term Strategic Value      |     20 |   6.9 | Platform credible; needs production ceremony evidence to upgrade trust |

- Final sovereign / DFI lens score: **6.8**

## Top Remediation Items

| Priority | Item                                                                              | Owner                | Dependency                         | Target           |
| -------- | --------------------------------------------------------------------------------- | -------------------- | ---------------------------------- | ---------------- |
| P0       | Commit or revert the remediation from this audit session (restore clean baseline) | platform-lead        | none                               | next working day |
| P1       | Finish PRD-002 infra deploy: amd64 image + rollout + prove `/audit/bundles` ≠ 404 | platform-lead        | ECR buildx amd64                   | this week        |
| P1       | Align TradePass DID resolver contract for audit-bundles verification              | protocols + platform | protocols TradePass endpoint shape | this week        |
| P2       | Refresh `docs/overview/README.md` metrics + links on each master-audit            | platform-lead        | none                               | ongoing          |
| P2       | Add a small “staging audit probe” CI job once PRD-002 routes are live             | platform-lead        | #50–#52                            | after deploy     |

## One-point uplift conditions (per lens)

- Investor: demonstrate PRD-002 audit route “Tier A” (route ≠404 + nonce gate) on staging in CI
- Enterprise: publish a single, replayable runbook for PRD-002 with success criteria + evidence capture artifacts
- Sovereign/DFI: complete infra #86 ceremony and protocols #61 rotation to `key_status: production` with dated evidence
