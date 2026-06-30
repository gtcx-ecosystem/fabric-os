---
title: "GTCX QAP repository acceptance - fabric-os"
status: incomplete
date: 2026-06-30
owner: fabric-os
document_type: audit-report
authority: fabric-os AaaS/DaaS assurance lane
protocol_id: GTCX-QAP-001
---

# GTCX QAP Repository Acceptance - fabric-os

Decision: **incomplete**

MPR: **59/100**

SIGNAL: **L5 / 100**

Runbook: `docs/operations/runbooks/repo-cleanup-mpr-signal-loop.md`

## Control Scorecard

| Area | Score | Benchmark | Applicable | Evidence | MPR linkage | SIGNAL linkage |
| --- | ---: | ---: | --- | --- | --- | --- |
| Worktree clean | 100 | 100 | true | ## test/qap-loop-robustness | Craft, Trust & Safety | Grounded |
| Critical docs preserved | 0 | 100 | true | audit/evidence/repo-folder-file-spec-inventory-latest.json | Trust & Safety, Defensive Moat, IP Magic | Lossless, Specific |
| Feature/spec registry | 0 | 100 | true | docs:feature-spec:check evidence | Commercial Value, Product/Ecosystem Integration | Specific, Integrated, Actionable |
| Documentation hygiene | 100 | 100 | true | docs evidence witnesses | Compliance, World Class, Trust & Safety | Navigable, Grounded, Lossless |
| Roadmap/goals/milestones | 100 | 100 | true | roadmap/goals/milestone evidence | Commercial Value, Agentic Empowerment | Actionable, Integrated |
| Agile workflow | 100 | 100 | true | agile command evidence | Product/Ecosystem Integration, Craft | Actionable, Integrated |
| Ops contract | 100 | 100 | true | ops command evidence | Technical Excellence, Compliance | Grounded, Integrated |
| P22/runtime | 100 | 100 | true | pnpm agent:next-work --json exit 0 | Agentic Empowerment, Compliance | Actionable, Specific |
| Fabric AaaS/DaaS | 0 | 100 | true | AaaS/DaaS evidence witnesses | Technical Excellence, World Class | Grounded, Actionable |
| Operational lane isolation | 100 | 100 | true | operational lane scan clean | Product/Ecosystem Integration, Compliance | Integrated, Actionable |
| Foundational micro-audits | 92 | 100 | true | mpr.foundational.microAudits | Foundational MPR tier | Specific, Grounded |
| Transformational micro-audits | 92 | 100 | true | mpr.transformational.microAudits | Transformational MPR tier | Integrated, Actionable, Lossless |
| Root hygiene | 0 | 100 | true | pm, ops, agentic, reports, .claude, .cursor, .gemini, .kimi | Compliance, Craft | Navigable |
| Link/reference hygiene | 100 | 100 | true | aaas-hygiene-check-latest.json, docs-agents-latest.json, docs-architecture-latest.json, docs-business-latest.json, docs-folder-hygiene-latest.json, docs-fractal-mpr-latest.json, docs-operations-latest.json, docs-product-latest.json, docs-roadmap-latest.json | World Class, Trust & Safety | Navigable, Grounded |
| Cross-repo contract | 100 | 100 | true | contract evidence witnesses | Product/Ecosystem Integration | Integrated |
| Archive recoverability | 0 | 100 | true | audit/evidence/repo-cleanup-archive-manifest-latest.json | Trust & Safety, Defensive Moat | Lossless |

## Loop State

| Iteration | MPR | SIGNAL | Dimensions below benchmark | Remediation | Decision |
| --- | ---: | --- | --- | --- | --- |
| 1 | 59 | L5 / 100 | Critical docs preserved, Feature/spec registry, Fabric AaaS/DaaS, Foundational micro-audits, Transformational micro-audits, Root hygiene, Archive recoverability, MPR | inventory witness missing or below benchmark | incomplete |

## Blockers

- Critical docs preserved: 0/100 — inventory witness missing or below benchmark (audit/evidence/repo-folder-file-spec-inventory-latest.json)
- Feature/spec registry: 0/100 — feature/spec validation below benchmark (docs:feature-spec:check evidence)
- Fabric AaaS/DaaS: 0/100 — AaaS/DaaS evidence below benchmark (AaaS/DaaS evidence witnesses)
- Foundational micro-audits: 92/100 — foundational MPR micro-audits below benchmark (mpr.foundational.microAudits)
- Transformational micro-audits: 92/100 — transformational MPR micro-audits below benchmark (mpr.transformational.microAudits)
- Root hygiene: 0/100 — forbidden live roots present (pm, ops, agentic, reports, .claude, .cursor, .gemini, .kimi)
- Archive recoverability: 0/100 — archive manifest missing or below benchmark (audit/evidence/repo-cleanup-archive-manifest-latest.json)
- MPR: 59/100 — MPR cleanup composite is below 100/100 (audit/evidence/mpr-repo-latest.json)

## Evidence

- Machine artifact: `audit/evidence/repo-cleanup-mpr-signal-acceptance-latest.json`
- Inventory: `audit/evidence/repo-folder-file-spec-inventory-latest.json`
- Archive manifest: `audit/evidence/repo-cleanup-archive-manifest-latest.json`
