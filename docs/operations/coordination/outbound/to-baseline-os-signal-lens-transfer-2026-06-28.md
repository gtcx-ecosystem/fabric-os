---
title: 'Outbound — transfer the SIGNAL lens (agentic-maturity evaluator) to baseline-os'
status: sent
date: 2026-06-28
from: fabric-os
to: [baseline-os]
ticket: XR-SIGNAL-LENS-TRANSFER-001
parent: XR-AGENT-CAPABILITY-OWNERSHIP-001
authorityClass: A
protocol: P24
blocksIR: false
owner: baseline-os
document_type: runbook
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# To baseline-os — own the SIGNAL agentic-maturity lens

**One-line read:** the SIGNAL lens (6-dimension agentic-maturity evaluator) is now **BUILT and
running** as a fabric-os reference producer so the AaaS loop reaches full dual-lens operation today.
SIGNAL measures agentic maturity = **AI-OS content** = baseline-os's domain (per
`XR-AGENT-CAPABILITY-OWNERSHIP-001`). This ticket hands baseline-os the concrete artifacts to own.

## What exists now (fabric-os reference impl)

| Artifact          | Path (fabric-os)                                        |
| ----------------- | ------------------------------------------------------- |
| Pure scorer       | `platform/scripts/lib/aaas-signal.mjs`                  |
| CLI / producer    | `platform/scripts/aaas-signal-eval.mjs` (`aaas:signal`) |
| Tests             | `platform/scripts/tests/aaas-signal.test.mjs` (7)       |
| Witness it writes | `audit/evidence/signal-maturity-latest.json`            |

**Contract:** the lens is the MPR-parallel half of the AaaS framework (SoR
`machine/spec/aaas-audit-contract.json`, `lenses.signal`). The witness shape is fixed —
`dimensions[].{dimension, level}` + `overall` (weakest-link). The handoff synthesizer already
consumes it; **do not change the witness shape** without a contract bump.

## The model (what to preserve on transfer)

- Six dimensions: Systems Architecture · Tooling · Process · Safeguards · Monitoring · Team & Ownership.
- **Production-only** scoring ("building toward it" = current level), **weakest-link** overall, half-levels.
- L0-L5 per dimension from ordered evidence checks.

## Requested (baseline-os)

1. **Own** the SIGNAL lens (move the scorer + CLI + tests from fabric-os, or supersede with a
   baseline-os-native evaluator that writes the same witness shape).
2. Keep fabric-os as a **consumer** — it runs the lens and feeds the witness to the handoff
   synthesizer; it should not own the agentic-maturity rubric.
3. Coordinate the rubric with the cross-map in the contract (`lenses.crossMap`) so SIGNAL dimensions
   stay aligned to MPR pillars.

## fabric-os position

- `blocksIR: false` — full dual-lens operation works **now** via the fabric-os producer; this is an
  ownership move, not a blocker.
- On transfer, fabric-os deletes its reference impl and consumes baseline-os's producer (no duplicate).
- Sequence with `XR-AGENT-CAPABILITY-OWNERSHIP-001` (skills/rules/personas) — same AI-OS-content rationale.
