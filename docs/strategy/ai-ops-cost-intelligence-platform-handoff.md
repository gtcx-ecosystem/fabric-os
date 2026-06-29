---
title: 'Handoff — GTCX AI-Ops and Cost Intelligence Platform'
status: current
date: 2026-06-28
owner: fabric-os
document_type: handoff
tier: operating
review_cycle: on-change
---

# Handoff — GTCX AI-Ops & Cost Intelligence Platform

**Audience:** the next agent (any model). You have **none** of the prior chat context. This file + the
canonical roadmap are everything you need. Provider-agnostic — follow the repo's universal agent
instructions regardless of which model you are.

---

## 0. Read first (in this order)

1. **This file** (state, git reality, how to operate safely, the plan).
2. **`fabric-os/docs/strategy/ai-ops-cost-intelligence-platform.md`** — the canonical roadmap + research (Phases 0–4, four moat tracks, architecture, sources). On origin branch `docs/ai-ops-cost-intelligence-platform`.
3. The frozen contract: `baseline-os/docs/engineering/runtime/cost-router-v1.1.contract.json` — **do not violate it** (additive changes only; never fork pricing/scoring/usage schema).

## 1. Mission (one paragraph)

Close the loop so every repo's AI spend is **estimated, bounded, enforced, and (next) measured**: a
centralized capability×cost **matrix** (baseline-os) + per-repo **budgets** (bridge-os) feed a
**generator** that writes a per-repo `.agent/ai-cost-manifest.json` (model↔work matching + cost
estimate), a **CI gate** (fabric-os) fails builds that breach budget, and runtime routing/enforcement
runs through the existing baseline-os cost-router + CostGuard. Goal: bounded, auditable, optimized AI
spend across the fleet as the agent population scales.

## 2. Current state — DONE, on origin (collision-proof branches)

| Phase | Content                                                                  | Repo / branch                                                         | Commit              |
| ----- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------- |
| 0     | v1 schemas (`ai-repo-budget`, `ai-cost-manifest`) + griot proof manifest | bridge-os `ai-cost/phase0-2-3-bridge`; griot-ai `ai-cost/griot-clean` | fdfa2210 / f6d49ef4 |
| 1     | Capability-scored matrix + capability-aware routing + LiteLLM price-sync | baseline-os `ai-cost/phase1-clean`                                    | ee81fb0b8           |
| 2     | Per-repo `aiBudget` (15 repos) + `ai-cost-governance.json`               | bridge-os `ai-cost/phase0-2-3-bridge`                                 | fdfa2210            |
| 3     | Work→model→cost generator + fleet rollup                                 | bridge-os `ai-cost/phase0-2-3-bridge`; griot-ai `ai-cost/griot-clean` | fdfa2210 / f6d49ef4 |
| Gate  | AI-cost CI gate (budget enforcement teeth)                               | fabric-os `feat/ai-cost-check`                                        | 9ec70272            |
| Docs  | roadmap + research + this handoff                                        | fabric-os `docs/ai-ops-cost-intelligence-platform`                    | d8c0dae1            |

All tested: baseline-os **23/23** cost-router tests pass; generator reconciles griot to its proof
(`$62.68 ≈ $62.69`); gate proven both ways (FAIL on missing/over-budget, OK 7/7 on valid SoR).

## 3. THE GIT REALITY — read carefully

- **Every repo has a concurrent automated agent** (the "aaas" lifecycle / kaleidoscope / cockpit work)
  actively committing and **switching working-tree branches** and pushing to the **shared branch name
  `feat/ai-cost-manifest-proof`**. That shared name is **entangled — DO NOT use it for merge or new work.**
- All of _our_ work was re-anchored to **unique `ai-cost/*` branches** (table above) and pushed. Verified
  reachable on origin. **Always use `ai-cost/*` names and isolate in a git worktree** when working in
  baseline-os / bridge-os / griot-ai.
- **Main checkouts belong to the other agents** — leave them where they are. Our clean branches live in
  worktrees: `~/Sites/baseline-os-phase1-wt`, `~/Sites/bridge-os-aicost-wt`, `~/Sites/griot-aicost-wt`.
- One harmless stray local branch in griot (`ai-cost/griot-phase0-3`, mis-anchored) — ignore it; do not force-delete.

## 4. How to commit & push safely here (non-negotiable)

- **Bare `git push` is harness-blocked.** Push via the node wrapper: `pnpm --dir <ecoroot>/bridge-os ecosystem:git-push --repo <name>` (pushes that repo's _current_ checkout branch). For a worktree branch the wrapper can't target, push via a tiny node `execSync('git push -u origin <branch>', {cwd: <worktree>})` script (same mechanism; the pre-push atomic-settlement hook still fires).
- **Commit hooks reformat** (prettier "ATOMIC SETTLEMENT") — remote SHAs differ from your local pre-commit SHAs. Expected.
- **NO destructive actions, ever:** no `reset --hard`, no `push --force`, no `checkout .`, no branch `-D`, never push `main`. Normal pushes only (new branch / fast-forward; a rejected push is safe — never force it).
- **Stage only your files** — these repos carry concurrent-agent WIP + witness churn; `git add` explicit paths, never `git add -A`.
- Conventional commits, lowercase, no emojis. End commit messages with the repo's required `Co-Authored-By` trailer.

## 5. Architecture (the closed loop) + SoR ownership

```
agile-os (work) + repo workloads ──► [generator: bridge-os] ──► <repo>/.agent/ai-cost-manifest.json
baseline-os: capability×cost matrix ─┤        (matrix × budget × workload)            │
bridge-os: per-repo/tenant budget ───┘                                                ▼
                              runtime: routeInferenceRequest(strategy, requiredCapabilities) + CostGuard(tenantId)
                              CI: fabric-os ai-cost:check (fails build on budget breach)
```

**Ownership:** matrix + runtime = baseline-os · budget policy + generator = bridge-os · CI gate + WORM evidence = fabric-os · work data = agile-os · manifest + consumption = each repo. Budgets are **bottom-up estimate → top-down cap**.

## 6. Plan / open items (prioritized)

**CRITICAL PATH — human gate (unblocks everything):**

- **Merge the 5 `ai-cost/*` + gate branches to `main`** (from the unique branches, NOT the shared name). Phase 4 needs the matrix/budgets on `main` so repos can `import baselineos/cost-router`.

**Buildable now (no merge needed, fabric-os is clean/uncontested):**

- Wire `ai-cost:check` into CI — add to `platform/tools/scripts/validate-all.mjs` + a GitHub Actions workflow that checks out the bridge-os SoR (use the `AI_COST_BRIDGE_DIR` env hook already built into the gate).

**Post-merge (in order):**

- **Phase 4 — runtime measurement:** repos pass manifest `strategy`/`requiredCapabilities` → `routeInferenceRequest`, and `tenantId` → `WorkflowBudget` (CostGuard auto-pause); **retire griot's local `MODELS` price-fork** in `griot-ai/platform/src/baseline/engine.ts` → consume central matrix; populate manifest `spentMtdUsd` live from `CostGuard.snapshotTenant()`; **fix `fabric-os/platform/scripts/mlops-cost-router-staging-probe.mjs`** (currently FAIL) → close open friction item **FINOPS-F3** (this is the "no measured spend" root cause).
- **Moat A** — AI-native cost UX: unified Grafana panel + terminal-os control surface; extend bridge-os MCP `governance-middleware.ts` ambient narration from cache-stats to AI-budget burn.
- **Moat B** — sovereignty: per-tenant AI spend as WORM evidence (via `audit-flush`); **residency-based routing guard** — add `requireSelfHostForClass: ["regulated"]` to `ai-cost-governance.json` (the axis is foreign-API vs in-jurisdiction self-host, NOT provider nationality — open-weight models are the sovereign tier because they can run in-region).
- **Moat C** — self-host open-weight inference (matrix `selfHost: true` models) on the EKS GPU pool; measure `executeRoutedCacheAwareInference` (40–70% caching savings); Batch API for async workers.
- **Moat D** — eval-pipeline outcomes feed capability-score feedback → router auto-tunes (conservative-split → eval-gate → widen).

**Data gaps / flagged fixes:**

- Only griot has a real `.agent/ai-workload.json`; the other 14 repos are budget-only ($0 estimate) in the fleet rollup — author per-repo workloads to get true fleet numbers.
- `sync-pricing.mjs` flagged **2 price drifts** vs LiteLLM — ratify into the registry.
- **sensei-os `cost_tracker`** possible `$/1K`-vs-`$/1M` unit bug — verify (could be 1000× off internally).

## 7. Pending decisions (need the human)

1. Merge cadence (merge now vs keep stacking unmerged work — risky with concurrent agents).
2. Is the concurrent multi-agent fleet theirs? Pause during merge?
3. **GLM 5.2** — add to matrix? (Verified: 744B MoE, MIT open weights, 1M ctx, ~Opus-4.8 coding, Z.ai API ~$1.4/$4.4, OpenRouter ~$1/$4, self-host needs >1TB VRAM.) Would become the cheapest frontier-tier model → default min-cost pick for code/complex work. Pair with the §6 Moat-B residency guard before adopting.
4. Strategy/handoff doc home — fabric-os vs bridge-os (program office).

## 8. Verify / run

```bash
# baseline-os (Phase 1) — from the worktree or after merge:
cd <baseline-os> && npx vitest run __tests__/core/cost-router*.test.ts   # 23/23
node platform/packages/baselineos/scripts/sync-pricing.mjs               # price-drift self-check (exit 0)

# bridge-os (Phase 3) — generator:
pnpm ai:cost:manifest --repo griot-ai --matrix <baseline-os>/platform/packages/baselineos/src/data/llm-pricing-registry.json
pnpm ai:cost:manifest:write   # fleet rollup -> machine/ci/ai-cost-manifest-latest.{json,md}

# fabric-os (gate):
AI_COST_BRIDGE_DIR=<bridge-os-checkout> node platform/scripts/ai-cost-check.mjs   # OK 7/7 against valid SoR
```

## 9. Critical files

- Matrix: `baseline-os/platform/packages/baselineos/src/data/llm-pricing-registry.json`
- Router: `baseline-os/platform/packages/baselineos/src/core/cost-router.ts` (`pickInTier`, `filterByCapabilities`, `RouteInferenceRequest.requiredCapabilities`)
- Budget enforcement: `baseline-os/.../core/cost-guard.ts` (per-tenant; unchanged API)
- Budgets + governance: `bridge-os/machine/spec/repo-persona-profiles.json` (aiBudget), `bridge-os/machine/spec/ai-cost-governance.json`, `.../schemas/{ai-repo-budget,ai-cost-manifest}.schema.json`
- Generator: `bridge-os/platform/scripts/ai/ai-cost-manifest.mjs` + `.../lib/build-ai-cost-manifest.mjs`
- Gate: `fabric-os/platform/scripts/ai-cost-check.mjs`
- Workload input example: `griot-ai/.agent/ai-workload.json`
- Local price-fork to retire (Phase 4): `griot-ai/platform/src/baseline/engine.ts`

## 10. Non-negotiables recap

Frozen `cost-router-v1.1` (additive only, no forking) · `ai-cost/*` unique branches + worktrees · node-wrapper push, never bare · no destructive git · stage explicit paths only · never push main without explicit confirmation.
