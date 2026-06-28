# GTCX AI‑Ops & Cost Intelligence Platform

|                            |                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**                 | Roadmap approved; Phase 0 (proof slice) built + validated                                                                                                                         |
| **Date**                   | 2026‑06‑28                                                                                                                                                                        |
| **Owners**                 | baseline-os (matrix + runtime) · bridge-os (budget + generator + coordination) · fabric-os (CI gates + WORM evidence) · agile-os (work data) · each repo (manifest + consumption) |
| **Branches**               | `feat/ai-cost-manifest-proof` (bridge-os `9a0a14b7`, griot-ai `81f79f64`)                                                                                                         |
| **Canonical roadmap home** | this document (fabric-os program record); cross‑repo coordination via Protocol 24                                                                                                 |

This document is the durable record of the AI‑Ops cost-optimization work session: the approved feature roadmap (§2), the research and findings that produced it (§3), and the Phase 0 proof results (§4).

---

## 1. Executive summary

Across the ecosystem there is **no measured AI spend** (the only LLM telemetry witness is FAIL; `cost-stats` is in‑memory), cost logic is **scattered and drifting** (repos fork the frozen pricing registry; registry uses retired model IDs), yet **~80% of the machinery already exists, disconnected**. AI spend is **bounded today (~$300–1,500/mo)** but unbounded as the agent fleet scales — it scales with _agent activity_, not users. The _present_ cost problem is infrastructure ($3.4k/mo AWS, 128% over its $1,500 cap); AI is the _future_ one. We govern both now.

The platform closes the loop: every repo's agent folder carries a generated, real‑time **AI cost manifest** (budget · strategy · model preferences · feature↔model matching · estimated cost), computed by mapping each repo's actual work against a centralized, capability‑scored, always‑fresh model matrix, enforced at runtime by the existing router + CostGuard, surfaced through an AI‑native cost surface, and self‑tuned by eval feedback. Four moat tracks (AI‑native UX, sovereignty/governance, cost‑efficiency floor, adaptive intelligence) layer on the spine.

---

## 2. The Roadmap (approved)

### 2.1 Context

1. **No measured AI spend.** `fabric-os/audit/evidence/mlops-cost-router-staging-probe-latest.json` = **FAIL** (router can't import in staging). `cost-stats` is in‑memory only (open `FINOPS‑F3`). Spend is _estimated_, never _recorded_.
2. **Scattered + drifting cost logic.** baseline-os owns a frozen `cost-router` + 9‑model registry, but `griot-ai/.../baseline/engine.ts` ships its **own** `MODELS` table (in $/1K, drifting from registry $/1M) and `TASK_ROUTES` mini‑router; the registry uses **retired** IDs (`claude-sonnet-4-20250514`, retired 2026‑06‑15). This is the "consumers forking pricing" the frozen contract forbids.
3. **~80% exists, disconnected.** baseline-os (router + CostGuard per‑tenant budgets + `LocalInferenceCost`), bridge-os (budget policy, `agent-resource-budget` schema, repo→team map with **zero cost fields**, witness‑generator pattern, ambient cost narration), agile-os (work/velocity), fabric-os (eval‑pipeline, WORM audit, finops gates) are all built — but nothing closes _work → model match → budget → measured spend_.
4. **Bounded now, unbounded later.** AI scales with agent activity. Infra ($3.4k/mo, 128% over cap) is the present problem; AI is the future one.

Web research grounds the approach: routing + semantic caching cuts LLM cost **40–70%** (budget‑aware routing + caching = 47% in production) at **50–100ms** overhead (negligible vs 500–2000ms calls); proven rollout is **conservative split → eval gate → widen**. Pricing stays fresh via LiteLLM's auto‑syncing price map; capability scores from MMLU‑Pro/GPQA (reasoning), SWE‑bench/Aider (code), BFCL (tool‑use), LMArena (vision/preference).

### 2.2 Architecture — the closed loop

```
  agile-os (work/velocity) ─┐
  repo call-sites + workers ─┼─►  [Generator: bridge-os]  ──►  .agent/ai-cost-manifest.json   (per repo)
  AGENTS.md (teams/roles) ───┘         │  maps work ↔ matrix ↔ budget        { budget · strategy · model-prefs
                                       │                                       · feature↔model · est. cost }
  baseline-os: capability×cost matrix ─┤                                              │
  bridge-os: per-repo/tenant budget ───┘                                              ▼
                                                          runtime: routeInferenceRequest(strategy, requiredCapabilities)
                                                                   + CostGuard(tenantId)  ──►  measured spend
                                                                              │
                                            fleet rollup witness ──► AI-native cost surface (dashboard + ambient narration)
                                                                              │
                                            eval-pipeline outcomes ──► capability-score feedback ──► matrix auto-tunes
```

- **Ownership:** generator + budget policy = **bridge-os**; matrix + runtime = **baseline-os**; work data = **agile-os**; CI gates + WORM evidence = **fabric-os**; manifests + consumption = **each repo**. Budgets are **bottom‑up estimate → top‑down cap**.
- **Branch strategy:** proof‑slice first to validate schemas on real data, then phased per‑SoR branches in dependency order, coordinated via Protocol 24.

### 2.3 Phases

**Phase 0 — Proof slice** _(`feat/ai-cost-manifest-proof`; baseline-os, bridge-os, griot-ai)_ — v1 schemas + one hand‑generated griot manifest reconciled against griot's own `recordCost`. **Done — see §4.**

**Phase 1 — The Matrix** _(`feat/capability-cost-matrix`; baseline-os)_ — add `capabilities{reasoning,code,vision,longContext,toolUse,latencyClass}` + `selfHost` to `llm-pricing-registry.json` + `PricingModelEntry`; fix stale IDs (`claude-sonnet-4-20250514`→`claude-sonnet-4-6`; Haiku `$0.8/$4`→`$1/$5`; add `claude-opus-4-8` $5/$25, `claude-fable-5` $10/$50); capability‑aware `pickInTier()` (optional `requiredCapabilities`, gate before cost sort — backward‑compatible with frozen `cost-router-v1.1`); LiteLLM/OpenRouter reconciliation job → `price-drift-latest.json` witness → ratify. _Tests: registry schema, capability‑match units, drift reconciliation, contract‑compat (frozen exports unchanged)._

**Phase 2 — Budget Policy & Per‑Repo Allocation** _(`feat/ai-budget-policy`; bridge-os)_ — add `tenantId` + `aiBudget{}` to all 15 repos in `repo-persona-profiles.json`; new `ai-cost-governance.json` (mirrors `aws-cost-governance.json`) + `ai-repo-budget.schema.json`. Unlocks CostGuard per‑tenant enforcement for free. _Tests: schema, repo→tenant completeness, rollup sums to cap._

**Phase 3 — The Generator & Manifests** _(`feat/ai-cost-generator`; bridge-os + product repos)_ — `platform/scripts/ai/ai-cost-manifest.mjs` + `lib/build-ai-cost-manifest.mjs` (model on `build-ecosystem-status-report.mjs`); reads call‑sites + `TASK_ROUTES` + agile-os backlog/velocity + AGENTS.md → matches against matrix → writes per‑repo `.agent/ai-cost-manifest.json` + fleet `machine/ci/ai-cost-manifest-latest.{json,md}`; fabric-os CI gate keeps manifests fresh. _Tests: clean run across 15 repos, schema validation, estimate‑vs‑actual reconciliation, CI fails on staleness._

**Phase 4 — Runtime Wiring** _(`feat/ai-cost-runtime`; all AI‑calling repos)_ — repos pass manifest `strategy`+`modelPreferences`→`requiredCapabilities` into `routeInferenceRequest`, and `tenantId` into `WorkflowBudget` (CostGuard auto‑pause); **retire griot's local `MODELS` fork**; migrate retired IDs; `spentMtdUsd` live from `CostGuard.snapshotTenant()`; fix the staging probe (close `FINOPS‑F3`). _Tests: routed call honors strategy + capability gate; tenant‑budget auto‑pause; probe FAIL→PASS._

### 2.4 Moat tracks _(layer on the spine; each ships incremental, compounding advantage)_

- **A — AI‑Native Cost UX** _(fabric-os, terminal-os, ledger-ui)_ — unified "Fleet AI Cost" Grafana panel (infra $ + LLM $ + budget‑burn) **plus** an AI‑native control‑plane surface in terminal-os (ledger-ui styled): allocation‑vs‑actual, forecasted burn, anomaly **narration**, one‑tap per‑repo tuning. Extends the MCP ambient‑cost‑narration middleware from cache‑stats to AI‑budget burn. _Intelligence as gravity — the design moat._
- **B — Sovereignty / Governance** _(fabric-os, bridge-os)_ — per‑tenant AI spend as **WORM audit evidence** (via `audit-flush`→WORM S3) for DFI/central‑bank audit; `degradationMode: fail-closed` for regulated tenants; repo→tenant→jurisdiction mapping ties AI cost to the sovereignty‑scaling model.
- **C — Cost‑Efficiency Floor** _(baseline-os, fabric-os, 4-infrastructure)_ — self‑host open‑weight inference on the EKS GPU pool for high‑volume predictable workers (existing `CostGuard.recordLocalInference`/`LocalInferenceCost`) → marginal cost → ~0 as the fleet scales; extend + measure `executeRoutedCacheAwareInference` (40–70%); Batch API (50% off) for async workers. _Breaks Curve‑B linear scaling._
- **D — Adaptive Intelligence** _(fabric-os, baseline-os)_ — eval‑pipeline outcomes feed quality signals into matrix capability scores; router auto‑tunes model↔work matching via **conservative‑split → eval‑gate → widen** — cheaper models promoted only when the eval gate confirms quality holds. _Compounding, self‑improving advantage._

### 2.5 Critical files

| Concern                                              | Path                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Pricing/capability matrix                            | `baseline-os/platform/packages/baselineos/src/data/llm-pricing-registry.json`                                                            |
| Router (extend `pickInTier`/`RouteInferenceRequest`) | `baseline-os/platform/packages/baselineos/src/core/cost-router.ts`                                                                       |
| CostGuard (per‑tenant, unchanged API)                | `baseline-os/platform/packages/baselineos/src/core/cost-guard.ts`                                                                        |
| Frozen contract (must stay compatible)               | `baseline-os/docs/engineering/runtime/cost-router-v1.1.contract.json`                                                                    |
| Repo→tenant→budget                                   | `bridge-os/machine/spec/repo-persona-profiles.json`                                                                                      |
| New AI governance SoR + schemas                      | `bridge-os/machine/spec/ai-cost-governance.json`, `.../schemas/{ai-repo-budget,ai-cost-manifest}.schema.json`                            |
| Generator + pattern to model on                      | `bridge-os/platform/scripts/ai/ai-cost-manifest.mjs`; `.../lib/build-ecosystem-status-report.mjs`, `.../environment/env-cost-report.mjs` |
| Ambient narration middleware                         | `bridge-os/platform/mcp/lib/governance-middleware.ts`                                                                                    |
| Per‑repo manifest (new artifact)                     | `<repo>/.agent/ai-cost-manifest.json`                                                                                                    |
| Proof anchor / local fork to retire                  | `griot-ai/platform/src/baseline/engine.ts`, `griot-ai/platform/workers/youtube_intelligence.py`                                          |
| Work data inputs                                     | `agile-os/machine/ecosystem-sprint-backlog.json`, `.../ci/fleet-velocity-latest.json`                                                    |
| CI gate to extend                                    | `fabric-os/platform/scripts/finops-check.mjs`, `.../tools/scripts/validate-all.mjs`                                                      |

### 2.6 Verification

Per phase: unit/schema tests (`node --test`), generator dry‑run (`pnpm ai:cost:manifest`), extended `validate-all.mjs`; each phase emits a `machine/ci/` witness. End‑to‑end: `pnpm ai:cost:manifest:write` → 15 per‑repo manifests + fleet rollup; griot reconciles to `recordCost`; a live staging call honors strategy + capability gate and emits `InferenceUsageEvent`; CostGuard auto‑pauses on tenant breach; staging probe FAIL→PASS. Contract safety: frozen `cost-router-v1.1` exports/shapes unchanged. Cross‑repo: Protocol 24 (inbound tickets + one coordination doc; no harness/evidence copied between repos).

---

## 3. Research & findings (session appendix)

### 3.1 Cloud deployment strategy

fabric-os already encodes the cost‑correct reference cell (one shared EKS per env, `cost-profile` scale‑to‑zero tiers, VPC/NAT discipline, IRSA, WORM audit). The ecosystem risk is the other ~14 repos each standing up their own `docker-compose.prod.yml`‑derived infra.

**Cost post‑mortem → design rules:** per‑repo infra sprawl → _one shared cell per env_; NAT‑gateway proliferation (4/env) → _VPC endpoints + ≤1 NAT/env_; frontends on cluster → _stateless web to Cloudflare edge_; always‑on non‑prod → _scale‑to‑zero default_; per‑service DBs → _one RDS, database‑per‑service_; always‑on ML/GPU → _scale‑to‑zero, on‑demand GPU_; log/audit bloat → _short CloudWatch, WORM only for audit_; LLM token drift → _already solved by the cost‑router (keep)_.

**Workload tiers:** Edge/static (6 Next.js/Astro → Cloudflare) · Stateless API (Spot + Karpenter, namespace/product) · Stateful core (on‑demand, the only guaranteed tier) · Async/ML (Spot pool, scale‑to‑zero, Bedrock over parked GPU) · Jobs (Lambda + CronJobs). **Prod steady‑state target ~$700–1,200/mo all‑in, holding flat as the ecosystem onboards** — vs $3–5k+/mo under per‑repo sprawl. Note: **af‑south‑1 is a premium region (~10–30% above us‑east‑1)** — the cost advantage is design discipline, not the region. Cost scales with **sovereignty footprint** (jurisdictions × regulated tenants), not users; the $50k+ tier is demand‑funded (each sovereign cell paid for by the institution requiring it).

### 3.2 AI cost architecture inventory (three SoRs, ~80% built)

| Plane                      | SoR / owner          | Built today                                                                                                                                             |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LLM routing**            | baseline-os          | `cost-router.ts` (complexity→tier→cheapest), `llm-pricing-registry.json` (9 models), strategies min‑cost/balanced/max‑quality                           |
| **Budget enforcement**     | baseline-os          | `CostGuard` per‑workflow + per‑tenant (`tenantId`) accumulation + auto‑pause (`governance:cost-threshold-exceeded`); `LocalInferenceCost` for self‑host |
| **Budget contract**        | bridge-os            | `agent-resource-budget.schema.json` (`costCeilingUsd`, `modelClass`, `degradationMode`)                                                                 |
| **Budget policy**          | bridge-os            | `environment-cost-policy.json`, `aws-cost-governance.json`; `repo-persona-profiles.json` (15 repos, **no cost fields** — the gap)                       |
| **Credential vault**       | bridge-os            | agent vault (per‑env, not per‑repo)                                                                                                                     |
| **Ops/SLO + finops gates** | fabric-os            | 8 Grafana dashboards (incl. `llm-ops` with `compliance_gateway_cost_usd_total`), `finops-check.mjs`, `cost-profile`                                     |
| **Reporting idiom**        | agile-os / bridge-os | witness `*-latest.json` → generated `*-latest.md`                                                                                                       |

**Split:** baseline-os routes + meters; bridge-os contracts budgets + provisions keys. **No per‑repo cost dimension exists** — closest is `tenantId`. The frozen `cost-router-v1.1` contract **forbids forking pricing/scoring/usage schema** but permits additive optional fields.

**Dashboard — don't build a new app; close the seams in two moves.** (1) Unify the operator view: one "Fleet Cost & Budget" Grafana dashboard combining AWS spend (a small Prometheus exporter for the bridge-os `aws-cost-weekly.json` witness) + LLM spend (`compliance_gateway_cost_usd_total` + `baseline_tenant_cost_usd`) + SLO burn + budget‑vs‑actual gauges — ~90% assembly of metrics that already emit. (2) Close the agent/worker gap: wire `FINOPS‑F3` (durable per‑agent/tenant `cost-stats` rollup; it is in‑memory today) and enforce `agent-resource-budget` per agent. The moat‑grade exec surface (forecasted burn, ambient narration, one‑tap cold‑staging) is Moat Track A — Grafana stays the operator tool.

**The one small thing that unlocks per‑repo budgeting:** add `tenantId` + `aiBudget` to each entry in `repo-persona-profiles.json` (which already maps repo→team with zero cost fields) and thread `tenantId` through `WorkflowBudget` — then CostGuard's existing per‑tenant enforcement + `getCostByTenant()` yields per‑repo spend and auto‑pause for free. This is Phase 2.

### 3.3 AI spend reality (the estimate)

The decisive finding: **no measured LLM spend exists.** The only AI telemetry witness is FAIL (router can't import in staging); `cost-stats` is in‑memory (open `FINOPS‑F3`). Volume is bounded by hard caps (griot YouTube `YOUTUBE_DAILY_QUOTA=100`; nyota partner tier `10,000/month` _ceiling_; terra-os scheduled agents ~150–250 calls/day) ≈ **100–150k substantive calls/month** — matching the cost‑router's own `100k queries → $18 optimized / $550 max‑quality` benchmark.

| Category                          | Status                                                                                                    | Monthly                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| LLM/AI — actual today             | No telemetry; router probe FAILS                                                                          | **~$0–300**                                |
| LLM/AI — pilot ceiling (designed) | `$25/day/org` (compliance-os), `$5/day/principal` (compliance-gateway), `$0.25/request`; min‑cost default | <$750/org cap; actual ~$100s               |
| **AWS infra — MEASURED**          | Over cap                                                                                                  | **$2,293 (May) → $3,416 projected (June)** |
| AWS infra — target                | cost‑profile not enforced                                                                                 | $900–1,500                                 |

**Where $1,200/mo ranks + two cost curves.** The bridge-os prod budget ($1,200/mo, $1,500 fleet cap) is _lean_ for an enterprise‑grade stack (WORM audit, KMS signing, GuardDuty, multi‑AZ RDS, Linkerd, Kyverno) — it's low because the design refuses always‑on waste, not because capability is missing. Costs split into two curves that behave differently: **Curve A (infra) is bounded** — ~$1,200 holds nearly flat as repos onboard (shared cell), stepping up only on data (read replicas/Aurora ACUs), NAT/egress, and node count; realistic trajectory ~$1,200 → ~$3–5k at 10× load. **Curve B (LLM tokens) is unbounded** — decoupled from infra, scaling with _agent activity_; at 100k queries/mo, cost‑optimized ≈ $18 vs $550 max‑quality (30× spread). The crossover: under optimized routing the two stay comparable until ~10–20 active agents, then LLM dominates — but at 1/10th–1/50th of naive frontier. The platform governs Curve B before it becomes the new surprise bill.

Unit economics under optimized routing: **~$0.0018–0.0025/call** (5–8× below frontier‑everything; 15–30× with free‑tier + caching). **Five compounding optimization levers:** model↔work matching (5–30×) · prompt caching via `executeRoutedCacheAwareInference` (2–5× on agent loops) · Batch API for async (2×) · degradation modes (`lower-model-class`) · scale‑to‑zero workers. Budgeting primitive: **~$120/active agent/month optimized** (vs ~$800 naive). Fleet: ~$2k–5k/mo at 20 agents, $6k–12k at 50, $18k–90k at 200. **AI cost is bounded and tiny today; the dollars are in infra, overspending its own policy.**

### 3.4 Pricing & capability landscape + sync source

**Keep the registry as SoR; feed it from an aggregator.** Negotiated contract prices, self‑host compute rows, the frozen schema, and sovereignty/audit all require an owned SoR. Use **LiteLLM `model_prices_and_context_window.json`** (BerriAI/litellm — direct‑provider prices, no resale markup, auto‑sync, rich fields) as the primary drift source; **OpenRouter** `/api/v1/models` for availability/discovery; provider pages for negotiated rates. Reconciliation job _proposes_ → SoR owner _ratifies_ (respects "no forking pricing").

Current authoritative Anthropic rows: Fable 5 $10/$50 · Opus 4.8 $5/$25 · Sonnet 4.6 $3/$15 · Haiku 4.5 **$1/$5** (registry's $0.8/$4 is wrong). Verified third‑party (June 2026): gemini‑2.5‑flash $0.15/$0.60 · deepseek‑v3 $0.27/$1.10 (v4‑flash $0.14/$0.28) · groq‑llama‑3.3‑70b $0.59/$0.79 · gpt‑4.1 $2/$8. Capability‑score dimensions: reasoning (MMLU‑Pro/GPQA), code (SWE‑bench/Aider), tool‑use (BFCL), vision/preference (LMArena). Self‑host open‑weight on owned GPUs is the marginal‑cost floor.

### 3.5 LLM routing research (cited)

Model routing + semantic caching cuts LLM cost **40–70%**; budget‑aware routing + caching = **47%** in production. Semantic routing adds **50–100ms** (single‑digit % of a 500–2000ms call). Proven rollout: **conservative split → eval gate → widen one notch at a time.** Sources in §5.

---

## 4. Phase 0 proof results (built + validated)

**Committed:** bridge-os `9a0a14b7` (`ai-repo-budget.schema.json`, `ai-cost-manifest.schema.json`), griot-ai `81f79f64` (`.agent/ai-cost-manifest.json`).

**Validated (exit 0):** schemas conform; manifest arithmetic reconciles (items→totals, byTier, byProvider); every item resolves to a central registry id.

**Finding:** griot-ai = **$62.69/mo current → $22.71/mo matrix‑optimized (64% savings)**, dominated by migrating the YouTube worker off hardcoded **retired** `claude-sonnet-4-20250514` to Haiku (structured extraction clears Haiku's bar). The manifest's `drift[]` auto‑flagged: the retired ID; `engine.ts`'s local price‑table fork (forbidden by the frozen contract); and its $/1K‑vs‑$/1M unit divergence. The artifact shape is proven on real data and safe to automate (Phase 3).

---

## 5. Sources

- LiteLLM price map — github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json
- LLM model routing 2026 (cost‑quality) — digitalapplied.com/blog/llm-model-routing-2026-cost-quality-optimization-engineering-guide
- LLM cost optimization 2026 (routing/caching/batching) — maviklabs.com/blog/llm-cost-optimization-2026
- LLM gateways & model routing — lushbinary.com/blog/llm-gateway-model-routing-cost-optimization-guide
- LLM leaderboard / capability benchmarks — llm-stats.com ; lmarena (Arena Elo, Code/Vision sub‑leaderboards)
- LLM API pricing comparison 2026 — benchlm.ai/llm-pricing ; aipricing.guru ; groq.com/pricing
- Anthropic model IDs + pricing — verified via the `claude-api` reference skill (cached 2026‑06‑04)
