---
title: 'Assessment — Cloudflare Workers AI + GLM-5.2 for GTCX agentic workloads'
status: current
date: 2026-06-27
owner: fabric-os
document_type: assessment
tier: operating
tags: ['llm-routing', 'cloudflare', 'workers-ai', 'glm', 'sovereignty', 'cost-router']
review_cycle: on-change
routing_sor: baseline-os/platform/packages/baselineos/src/core/cost-router.ts
---

# Cloudflare Workers AI + GLM-5.2 — adoption assessment

**Question:** "To begin using Workers, is there a way to use open-source models
like GLM-5.2?" — and should GTCX?

**Answer:** Yes, three ways. But the decision turns on _why_, and the obvious
reason (cost) is the wrong one. The real case is **sovereignty + edge latency +
model portability**, not price.

## Lead finding (honest correction)

GLM-5.2 on Workers AI is **$1.4 / $4.4 per 1M tokens** (input/output)
([model page](https://developers.cloudflare.com/workers-ai/models/glm-5.2/)). That
is **not** a cheap-tier model. Against the live registry
(`baseline-os/.../llm-pricing-registry.json`):

| Model                    | $/1M in  | $/1M out | Tier     |
| ------------------------ | -------- | -------- | -------- |
| Gemini 2.0-Flash         | 0.10     | 0.40     | free     |
| Groq llama-3.3-70b       | 0.59     | 0.79     | free     |
| DeepSeek-chat            | 0.27     | 1.10     | cheap    |
| Gemini 2.5-Flash         | 0.15     | 0.60     | cheap    |
| **GLM-5.2 (Workers AI)** | **1.40** | **4.40** | **~mid** |
| Claude Haiku             | 0.80     | 4.00     | mid      |
| Claude Sonnet            | 3.00     | 15.00    | frontier |

GLM-5.2 lands at **mid tier** — pricier than DeepSeek, Gemini Flash, and Groq on
both axes. **Routing simple/cheap tasks to it would lose money.** (A draft
integration that priced it at `$0.05/$0.15` — ~28× too low — would make the
`min-cost` router over-prefer it; do not do that.) Its value is elsewhere.

## What actually makes it compelling

1. **Open weights (MIT) → one model across all three execution modes.** GTCX
   already runs (a) the API cost-router (Anthropic/OpenAI/Gemini/DeepSeek/Groq)
   and (b) a sovereign `LocalEngine` (Ollama/llama.cpp) for offline. GLM-5.2 is the
   one frontier-grade model that can run on **Workers AI edge**, **self-hosted**,
   _and_ **local Ollama** — the same weights. That lets the cost-router fail over
   edge → local on the _same model family_, which no API-only provider allows.
2. **Edge inference in African POPs** — Cape Town, Durban, Johannesburg, Cairo,
   Mombasa, Luanda, Port Louis ([network](https://www.cloudflare.com/network/)).
   Inference runs at the nearest edge, aligning with baseline-os's "intermittent
   power, low-bandwidth" target. Materially lower RTT than us-/eu-hosted APIs for
   Global South mobile/USSD.
3. **Data localization** — Regional Services can pin prompts/responses to South
   Africa / specific jurisdictions
   ([data localization](https://developers.cloudflare.com/data-localization/how-to/workers/)).
   The router today _declares_ residency per provider but does not _enforce_ it;
   Workers Regional Services enforces at the edge.
4. **Provenance hedge vs DeepSeek.** Both GLM (Zhipu/Z.ai) and DeepSeek are
   China-origin. DeepSeek is consumed as a **China-hosted API**
   (`gtcx-provider-registry.ts:128` "evaluate data residency"). GLM-5.2 as
   **open weights on Cloudflare edge or local Ollama** never sends data to a
   China-hosted endpoint — a strictly better sovereignty posture for the same
   model lineage.
5. **1M context, agentic coding, function-calling/reasoning** — fits dev/agent
   workloads (including this ecosystem's own).

## Three integration paths (to the question asked)

| Path               | How                                                 | When                               |
| ------------------ | --------------------------------------------------- | ---------------------------------- |
| Workers AI binding | `env.AI.run("@cf/zai-org/glm-5.2", …)`              | "just begin" — serverless, no keys |
| AI Gateway         | route via one endpoint w/ caching, rate-limit, BYOK | multi-provider control plane       |
| Direct `fetch`     | call Z.ai / self-hosted                             | full control, you own keys         |

## Where it plugs into GTCX (verified seams)

The cost-router is provider-agnostic and adding a provider is mostly config —
**except runtime execution, which is real code**:

1. **Pricing** (config) — `baseline-os/.../data/llm-pricing-registry.json`: add
   `provider: "cloudflare"`, `model: "@cf/zai-org/glm-5.2"`, **`inputCostPer1M: 1.4,
outputCostPer1M: 4.4`**, `tier: "mid"`. Route _planning_ works immediately.
2. **Vault/creds** (config) — `baseline-os/.../vault/src/gtcx-provider-registry.ts`:
   add the `cloudflare` provider (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`),
   `regionNote: "edge; Regional Services → ZA residency"`.
3. **Runtime adapter** (NEW CODE — the actual work) —
   `gtcx-os/.../inference/backend-for-route.ts` `createBackendForRoute()` executes
   only Anthropic/OpenAI today. A Cloudflare Workers-AI delegate backend must be
   added before any route can _execute_ on GLM-5.2.

## Recommendation — staged pilot, not rip-and-replace

- **Phase 0 (config, hours):** register Cloudflare + GLM-5.2 at the **correct**
  price so `baseline cost-route` can cost-compare and plan it. No execution yet.
- **Phase 1 (build):** implement the Workers-AI runtime adapter in
  `backend-for-route.ts`; gate behind `PREFERRED_PROVIDER=cloudflare` (opt-in).
  Start with the **AI Gateway** path for observability + BYOK.
- **Phase 2 (the strategic win):** make GLM-5.2 the **sovereign-portable** model —
  Workers AI edge when online (low-latency Africa), Ollama `LocalEngine` when
  offline — and let the router fail over on the same weights, with `CostGuard`
  tracking edge $ vs local kWh. Enable Regional Services (ZA) for residency-bound
  prompts.

## Skip / caution signals (do not ignore)

- **Not for the cheap tier.** Keep simple/`min-cost` tasks on DeepSeek / Gemini
  Flash / Groq. GLM-5.2 is for agentic-coding, long-context, and sovereign-portable
  routes only.
- **Verify Neuron/egress billing.** Multiple price trackers flag a Workers AI
  "egress trap"; confirm against
  [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
  before trusting the $1.4/$4.4 figure at GTCX volumes.
- **Runtime adapter is owned by gtcx-os/baseline-os, not fabric-os.** fabric-os
  owns deployment topology; the router + adapter are baseline-os/intelligence SoR.
  This assessment is a recommendation to those owners, not a fabric-os build item.

## Ownership / next step

Routing + adapter are **baseline-os** (cost-router SoR) and **gtcx-os**
(chokepoint). fabric-os's interest is deployment topology + sovereignty
enforcement. If pursued, file a P24 handoff to baseline-os to land Phase 0/1.

Sources: [GLM-5.2 on Workers AI](https://developers.cloudflare.com/changelog/post/2026-06-16-glm-52-workers-ai/) ·
[model page](https://developers.cloudflare.com/workers-ai/models/glm-5.2/) ·
[Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) ·
[network/POPs](https://www.cloudflare.com/network/) ·
[data localization](https://developers.cloudflare.com/data-localization/how-to/workers/) ·
[AI Gateway BYOK](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/).
