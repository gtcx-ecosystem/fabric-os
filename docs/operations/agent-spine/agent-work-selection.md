---
title: 'Agent Work Selection Manifest'
status: current
date: 2026-06-05
owner: fabric-os
tier: critical
tags: [['protocol-22', 'agent', 'work-selection']]
review_cycle: on-change
document_type: runbook
role: platform-architect
document_id: OPS-AWS-001
protocol: canon-os/01-docs/governance/protocols/22-agent-work-selection/protocol.md
adoption_status: established
---

# Agent Work Selection — fabric-os

> **Protocol:** [Protocol 22 — Agent Work Selection](https://github.com/gtcx-ecosystem/canon-os/blob/main/01-docs/governance/protocols/22-agent-work-selection/protocol.md) (AGENT-WORK-SEL)
> **Rule:** Agents compute next work from the execution roadmap and work register. **Never ask the operator which story to pick.**

## Canonical paths

| Artifact                           | Path                                            |
| ---------------------------------- | ----------------------------------------------- |
| Execution roadmap (story register) | `audit/product-management/execution-roadmap.md` |
| Session pointer                    | `01-docs/audit/auto-dev-state.md`               |
| Baseline session memory            | `.baseline/memory/session.md`                   |
| Selection script                   | `03-platform/scripts/agent-next-work.mjs`       |

## Commands

```bash
pnpm agent:next-work

## Regulatory-audit frame (prefer evidence / assurance work when automatable)
AGENT_FRAME=regulatory-audit pnpm agent:next-work
```

## Active phase

**Co-primary programs (2026-06-12):** DAAS **complete** · **SECAS complete** (internal_closure_complete 2026-06-17). IR implement queue **drained** — S4-07 **done** (P35 path drift).

When `pnpm agent:next-work` returns a story ID, execute it. When `backlogClear: true`, run **witness** (`node 03-platform/tools/scripts/validate-all.mjs`) + refresh evidence gates — do not idle. **Human gates (XC)** run parallel — do not block IR implement queue.

**LAUNCH-PLAN-01/02/03 are done** — do not re-select; zwcmp-unblock work lives in `.baseline/launch-focus.json` workSet.

| Artifact          | Path                                                                             |
| ----------------- | -------------------------------------------------------------------------------- |
| Cross-repo bridge | `01-docs/04-ops/coordination/cross-repo-agent-bridge.md`                         |
| Latest audit      | `01-docs/05-audit/engineering-audit-2026-06-07.md`                               |
| GTM audit         | `audit/gtm-audit-2026-06-05.md` · witness `audit/evidence/gtm-audit-latest.json` |

**Cross-repo:** S-XR-1 **closed** — XR-101/201 done. S-XR-2 **closed** — XR-202/301/302 done. S-XR-3: XR-401 **done**, XR-402 **ready**, XR-405 **done**. S-XR-4: XR-507 **done**, XR-508 **done**.

**External/vendor gates — NOT on this register:** [`ops/coordination/post-launch-external-gates.json`](../../ops/coordination/post-launch-external-gates.json) (BG-10-10, BG-10-11, vendor report). **Internal human — NOT P22:** [`ops/coordination/internal-human-gates.json`](../../ops/coordination/internal-human-gates.json).

**Forbidden:** Listing EXT-INF-_ or BG-10-_ on internal execution roadmaps, launch-focus human queue, or P22 next work.

## Work register (Protocol 22 — explicit backlog)

| ID                        | Title                                                                   | P   | Status  | Class    |
| ------------------------- | ----------------------------------------------------------------------- | --- | ------- | -------- |
| IR-2.1                    | Dependabot tier-3 merges                                                | P2  | blocked | external |
| IR-2.2                    | AI SDK v5→v6 migration branch + eval regression                         | P1  | done    | code     |
| IR-2.3                    | CodeQL/Trivy SARIF upload graceful when Code Security disabled          | P0  | done    | code     |
| IR-3.1                    | WORM upload workflow                                                    | P1  | done    | code     |
| IR-3.2                    | Document operator live path for runtime-evidence-check                  | P1  | done    | ops-docs |
| IR-3.4                    | Expand `gtcx-ctl validate-environment` in CI                            | P1  | done    | code     |
| IR-3.5                    | Refresh DR fire-drill dated artifact                                    | P1  | done    | ops-docs |
| IR-4.1                    | USSD path soak test in CI                                               | P1  | done    | code     |
| IR-5.1                    | Cross-repo-contract token                                               | P2  | done    | code     |
| IR-5.2                    | Re-run ecosystem-repo-review; ledger ≥9.0 matrix green                  | P2  | done    | ops-docs |
| LAUNCH-PLAN-01            | Reconcile execution-roadmap + work register                             | P1  | done    | plan     |
| LAUNCH-PLAN-02            | Refresh auto-dev-state for launch/GTM                                   | P1  | done    | plan     |
| LAUNCH-PLAN-03            | Global South 10x plan status row update                                 | P1  | done    | plan     |
| GTM-AUDIT                 | Lane-5 GTM completeness audit                                           | P1  | done    | plan     |
| S2-13                     | Pen-test SOW signature                                                  | P0  | done    | external |
| S4-03                     | PRD-002 Tier B: align TradePass DID doc resolver contract               | P1  | blocked | external |
| P22-INFRA-01              | Protocol 22 adoption — manifest + script + CI                           | P0  | done    | ops-docs |
| S4-04                     | deployment-guard typecheck regression                                   | P1  | done    | code     |
| S4-05                     | audit-signer + compliance-gateway lint regressions                      | P1  | done    | code     |
| S4-06                     | README gaps (12 dirs) per repo-hygiene audit                            | P0  | done    | code     |
| S4-07                     | pnpm test quick 1/359 flake investigation                               | P2  | done    | code     |
| SECAS-S2-01               | Pen-test ingest scaffolding (internal prep)                             | P0  | done    | ops-docs |
| SECAS-S2-02               | Automated ingest witness + milestone unblock + parallel-lane messaging  | P0  | done    | code     |
| SECAS-S4-02               | Fleet supply-chain security gates                                       | P0  | done    | code     |
| SECAS-S4-03               | Standing vulnerability management cadence                               | P1  | done    | code     |
| SECAS-S4-04               | Pen-test findings remediation track + re-test witness                   | P0  | done    | code     |
| SECAS-S4-05               | Expand SECaaS cards — terminal-os, fabric-os self, bridge witness repos | P2  | done    | code     |
| SECAS-S5-01               | Unified fleet risk + active threat registers                            | P0  | done    | ops-docs |
| XR-FABRIC-SPRINT-AUTH-001 | Sprint authority L2 read contract witness                               | P1  | done    | ops-docs |

## Implementation classes

| Class                | Detection                                                             | Development frame                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **code**             | Scripts, tests, gates, CI workflows, Terraform, K8s manifests         | **Select**                                                                                                                                              |
| **ops-docs**         | Author `01-docs/`, manifest, Protocol 22, roadmap reconcile, runbooks | **Select**                                                                                                                                              |
| **evidence-capture** | Manual UAT, staging probe with live credentials                       | Skip                                                                                                                                                    |
| **external**         | Human SOW signature, CISO decision, Supabase unpause, DNS zone:write  | Skip **story ID** — repo IR/witness continues ([nav](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/human-gate-navigation.md)) |

## Status sources

1. **Work register** (this file) — authoritative for `IR-*` and `P22-*` items.
2. **`audit/product-management/execution-roadmap.md`** — sprint tables (`S1-*`, `S2-*`, `S3-*`, `S4-*`); `**done**` / `**closed**` → done.
3. **`.baseline/memory/session.md`** — active session state and next recommendations.

## Gate lifecycle (normative — fleet)

| Lane                                      | On internal roadmap? | P22? | System of record                                             |
| ----------------------------------------- | -------------------- | ---- | ------------------------------------------------------------ |
| **Engineering** (Class R)                 | Yes                  | Yes  | This manifest + execution roadmap                            |
| **Internal human** (GTCX team)            | No                   | No   | `fabric-os/ops/coordination/internal-human-gates.json`       |
| **Post-launch external** (vendor/auditor) | No                   | No   | `fabric-os/ops/coordination/post-launch-external-gates.json` |
| **Formal GTM adoption**                   | No                   | No   | agile-os GTM programme · LegalOps / RevOps                   |

**Forbidden:** EXT-INF-\*, vendor pen-test calendar (BG-10-10), SOC 2 opinion (BG-10-11), or SECAS vendor wait on engineering/GTM sprint boards.

Spec: `bridge-os/pm/spec/gate-lifecycle-taxonomy.json`

## Forbidden

- Asking the user which story to pick when this manifest and roadmap exist.
- Starting external-class stories (S4-03, XR-403–404, EXT-INF-_, BG-10-_, S2-13 vendor tail) without explicit human authorization.
- Raising post-launch external gates on internal roadmaps, launch-focus, or P22 (use post-launch-external-gates.json only).
- Silently skipping a story that is implementable in the current frame.

## After each story

1. Mark done in work register and/or `audit/product-management/execution-roadmap.md`.
2. Run `pnpm agent:next-work` for the next ID.
3. Refresh `01-docs/05-audit/auto-dev-state.md` and `.baseline/memory/session.md`.
4. Micro-commit; run `node 03-platform/tools/scripts/validate-all.mjs` when touching repo gates.
