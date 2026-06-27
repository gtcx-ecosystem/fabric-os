---
title: 'AaaS Honesty Gate — Design'
status: current
date: 2026-06-27
owner: fabric-os
document_type: spec
tier: operating
tags: ['aaas', 'audit', 'honesty-gate', 'assurance']
review_cycle: on-change
---

# AaaS Honesty Gate — Design

## Problem

Audits in the GTCX ecosystem default to **scoring the map, not the territory**:
they enumerate the easiest-to-list artifact (`apps/*` folders, a harness number)
and treat it as the product. The markets-os assessment reproduced this exactly:

1. **No deepest-route check** — a `reports/[id]` fabrication (every empty report
   silently rendered another report's body) survived because audits scored the
   landing page, never `/[id]`.
2. **No real/fixture/fabricated tag** — surfaces scored up on craft while one
   click deeper they served fabricated content with no disclosure.
3. **No capability coverage** — the existing probe checks a `docs/ux` path
   _exists_, not that the audit covered every capability the product claims.
4. **No contradiction meta-check** — a 9.0 sat over a broken surface.

These are not auditor mistakes to coach away; they are the absence of a forcing
function. This gate is that forcing function.

## Principle

**Extend the framework, don't duplicate it.** The bridge-os five-core engine
(gates, caps, weighted composite) and the canon registry already exist. This gate
is a thin fabric-os AaaS layer that _consumes_ both and adds the four missing
checks. It owns no scoring engine of its own.

## Three legs (two exist, one is new)

| Leg                          | Source                                                    | Status  |
| ---------------------------- | --------------------------------------------------------- | ------- |
| Coverage denominator         | `machine/canon/registry.json` (synthesized from canon-os) | exists  |
| Scoring / gate / cap engine  | bridge-os five-core witnesses                             | exists  |
| Honesty contract + validator | this spec                                                 | **new** |

## Contract — `gtcx://fabric-os/aaas-honesty-coverage/v1`

The audit producer (LLM or probe) must emit
`audit/evidence/aaas-honesty-coverage.json` with one entry per capability in the
registry:

```json
{
  "schema": "gtcx://fabric-os/aaas-honesty-coverage/v1",
  "entries": [
    {
      "capabilityId": "FEAT-FABRIC-OPS-ASSURANCE",
      "entryRoute": "platform/scripts/aaas-honesty-gate.mjs",
      "deepestRouteChecked": "platform/scripts/tests/aaas-honesty-gate.test.mjs",
      "veracity": "real",
      "disclosed": true,
      "score": 88,
      "worstFinding": "registry under-populated; coverage unverifiable for empty arrays"
    }
  ]
}
```

`deepestRouteChecked` must be a real path/route **one level past** `entryRoute` —
never equal to it. `veracity` is `real | fixture | fabricated`. `disclosed` is
whether a non-`real` surface tells the user it is not real.

## Validator — `platform/scripts/aaas-honesty-gate.mjs`

Pure core `evaluateHonesty({ registry, coverage, composite, opts })` →
`{ witness, ok }` (no fs — fully testable). CLI wrapper loads files and supports
`--write` / `--json`. Witness: `audit/evidence/aaas-honesty-gate-latest.json`,
schema `gtcx://fabric-os/aaas-honesty-gate/v1`. Exit nonzero on any failure.

### Gates (each maps to a markets-os failure)

| Gate                      | Fails when                                                                                             | markets-os symptom          |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------- |
| `coverageComplete`        | a registry capability has no coverage entry                                                            | "scored the folders"        |
| `depthVerified`           | any entry's `deepestRouteChecked` is missing or `=== entryRoute`                                       | "never opened `/[id]`"      |
| `veracityDisclosed`       | any entry `veracity != real` with `disclosed != true`                                                  | the fabrication bug         |
| `contradictionReconciled` | composite ≥ `contradictionCeil` (85) while a covered capability scores < `floor` (60) and no cap fired | "9.0 over a broken surface" |
| `registryNonEmpty`        | registry has zero capabilities                                                                         | cannot audit nothing        |

`registryAuthoritative` is reported (registry `status !== 'draft'`); under
`--strict-registry` a draft registry that is claimed 100%-covered fails, because
claiming full coverage of an admittedly-incomplete map is itself "scoring the map."

### Lead with the worst

The witness's **first** field is `worstVerifiedFinding` (the `worstFinding` of the
lowest-scoring covered capability) — before any headline number. Reframes "what's
the score" into "what breaks."

## Provisioning

- `pnpm aaas:honesty:check` / `:check:write`.
- `aaas-friction-check.mjs` invokes the gate; its `ok` joins the structural gates.
- AaaS runbook (`docs/operations/runbooks/audit-as-a-service.md`) documents the
  contract, command, and witness path. Register schema in the runbook SoR table.

## Enforcement

- CI: a job runs `pnpm aaas:honesty:check` on PR + push to main; nonzero fails the
  build. The gate is advisory-logged for repos whose registry is still `draft`
  until the registry is populated (surfaced, not yet blocking) — tracked in the
  AaaS roadmap as the path to hard-block.

## Testing

`platform/scripts/tests/aaas-honesty-gate.test.mjs` (`node --test`): in-memory
registry × coverage fixtures exercising each failure mode (missing coverage,
landing-only depth, undisclosed fixture, contradiction, empty registry) each exit
nonzero; a clean fixture exits zero; `worstVerifiedFinding` surfaces the lowest
score.

## Out of scope (Spec 2)

Cadence / triggers — nightly + pre-merge scheduling that _runs_ gated audits
regularly. Gate first; cadence wraps it next.
