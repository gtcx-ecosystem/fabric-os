---
title: 'SIGNAL Roadmap — gtcx-infrastructure'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
overall_signal: L2-low
target_signal: L4-low
phase: 1-sprint-2-partial
---

# SIGNAL Roadmap

Canonical assessment: [`signal-assessment-2026-06-05.md`](./signal-assessment-2026-06-05.md)

## Sprint 1 progress (2026-06-05)

| Task                           | Status      | Evidence                                                         |
| ------------------------------ | ----------- | ---------------------------------------------------------------- |
| SIGNAL-INF-007 trace pilot     | **partial** | `validate-trace-correlation.mjs` PASS; full OTel staging pending |
| SIGNAL-INF-001 Human Lead      | **done**    | AGENTS.md @amanianai                                             |
| SIGNAL-INF-011 agent:next-work | **done**    | `scripts/lib/suggest-persona.mjs`, `agent-launch-focus.mjs`      |
| SIGNAL-INF-006 taxonomy        | **done**    | `cross-repo-agent-log.md` columns                                |
| SIGNAL-INF-012 topology        | **done**    | `docs/architecture/agent-topology-2026-Q3.md`                    |
| SIGNAL-INF-003 PR checklist    | **done**    | `docs/operations/agent-pr-checklist.md`                          |

## Sprint 2 progress (2026-06-05)

| Task                              | Status             | Evidence                                                        |
| --------------------------------- | ------------------ | --------------------------------------------------------------- |
| SIGNAL-INF-002 LLM dashboard      | **done** (in-repo) | `infra/monitoring/dashboards/llm-ops.json`                      |
| SIGNAL-INF-008 staging monitoring | **partial**        | `overlays/staging/monitoring/` + runbook; cluster apply pending |
| SIGNAL-INF-004 LangSmith/Helicone | **done** (shim)    | `tools/compliance-gateway/src/llm-trace.mjs`                    |
| SIGNAL-INF-007 OTel endpoint      | **partial**        | Jaeger OTLP env in metrics patch                                |

**Next:** Operator `kubectl apply` per `staging-monitoring-apply.md`; live scrape verify; monthly cost-stats import.

**Sprint 1 recap:** INF-007 pilot, INF-001, INF-011, INF-006, INF-012, INF-003 — see above.
