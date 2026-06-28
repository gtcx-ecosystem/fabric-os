---
title: 'Outbound — Cloudflare Workers AI + GLM-5.2 cost-router integration (baseline-os)'
status: sent
date: 2026-06-28
from: fabric-os
to: baseline-os
initiative: INIT-GTCX-SERVICE-FABRIC
ticket: XR-WORKERS-AI-GLM-001
related: [ECOSYSTEM-COST-ROUTER-2026-06-03]
authorityClass: R
protocol: P24
blocksIR: false
owner: baseline-os
evidence: docs/architecture/cloudflare-workers-ai-glm-assessment-2026-06-27.md
---

# To baseline-os — register Cloudflare Workers AI + GLM-5.2 in the cost-router

**One-line read:** fabric-os assessed adopting Cloudflare Workers AI + open-weight
GLM-5.2. Recommendation: **add it, but for sovereignty/edge/portability — not
cost.** The cost-router is the SoR you own; this is the handoff to land Phase 0/1.

Full assessment (grounded in your cost-router): `fabric-os/docs/architecture/cloudflare-workers-ai-glm-assessment-2026-06-27.md`.

## Why (corrects a pricing trap)

GLM-5.2 on Workers AI is **$1.4 / $4.4 per 1M** = **mid tier**, NOT cheap. It is
pricier than DeepSeek / Gemini-Flash / Groq — routing simple/`min-cost` tasks to
it loses money. **Do not register it under the cheap/free tier.** Its value:

1. **Open weights (MIT)** — the one model that runs on Workers AI edge, self-host,
   and your `LocalEngine` (Ollama). Enables router fail-over **on the same weights**
   (edge → local), which no API-only provider allows.
2. **Edge inference in African POPs** (Cape Town, Durban, Johannesburg, …) — lower
   RTT for the Global South / USSD profile.
3. **Data localization** — Regional Services pins inference to ZA; the router today
   _declares_ residency (`gtcx-provider-registry.ts`) but does not _enforce_ it.
4. **Provenance hedge vs DeepSeek** — same China-origin lineage, but open weights on
   edge/local never hit a China-hosted API.

## Requested (baseline-os / gtcx-os owned seams)

| Phase            | Where                                                 | Change                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** (config)   | `baseline-os/.../data/llm-pricing-registry.json`      | Add `provider: cloudflare`, `model: @cf/zai-org/glm-5.2`, **`inputCostPer1M: 1.4, outputCostPer1M: 4.4`, `tier: mid`**. Enables `baseline cost-route` to plan it.                                    |
| **0** (vault)    | `baseline-os/.../vault/src/gtcx-provider-registry.ts` | Add `cloudflare` provider (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`), `regionNote: edge; Regional Services → ZA`.                                                                             |
| **1** (runtime)  | `gtcx-os/.../inference/backend-for-route.ts`          | Add a Workers-AI delegate backend to `createBackendForRoute()` (executes only Anthropic/OpenAI today). Start with the AI Gateway path (caching + BYOK). Gate behind `PREFERRED_PROVIDER=cloudflare`. |
| **2** (strategy) | router + `CostGuard`                                  | Sovereign-portable failover: Workers AI edge online → Ollama `LocalEngine` offline on the same GLM weights; track edge $ vs local kWh.                                                               |

## Caveat to verify

Confirm Neuron/egress billing against Cloudflare's Workers AI pricing before
trusting $1.4/$4.4 at GTCX volumes (price trackers flag an egress trap).

## fabric-os position

- This is a recommendation to the routing SoR, not a fabric-os build. fabric-os's
  interest is deployment topology + sovereignty enforcement.
- `blocksIR: false` — no fabric-os work is blocked on this.

## Ack template

```markdown
## outbound-ack — Workers AI + GLM-5.2

- **Status:** ack | in-progress | done
- **Owner:** baseline-os
- **Evidence:** commit SHA · GLM-5.2 in llm-pricing-registry at 1.4/4.4 mid · backend-for-route cloudflare adapter
```
