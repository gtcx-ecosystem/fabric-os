# AaaS Framework Design — MPR + SIGNAL dual-lens audit lifecycle

_status: design (for review) · date: 2026-06-28 · owner: fabric-os · supersedes: ad-hoc audit/report usage_

## Purpose

Finalize the Audit-as-a-Service framework: the artifact/folder model, the standards,
the protocols, and the workflows — with **MPR** and **SIGNAL** as the two assessment
lenses that (a) shape the framework and (b) are applied when running audits + producing
remediation feedback.

## 1. The two lenses (complementary, not merged)

| Lens       | Measures                 | Shape                                                                                                  | Owner                                       |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| **MPR**    | Readiness _breadth_      | 11 pillars × score 0-100; tiers (foundational/transformational); thresholds 85 unlock / 95 world-class | bridge-os (engine)                          |
| **SIGNAL** | Agentic _maturity/depth_ | 6 dims × level L0-L5; **weakest-link = overall**; production-only; half-levels                         | baseline-os (lens; agentic = AI-OS content) |

Scales are NOT merged. They coexist as two views. A fixed **cross-map** lets a finding
reference both:

| SIGNAL dimension     | MPR pillar(s)                                    |
| -------------------- | ------------------------------------------------ |
| Systems Architecture | technicalExcellence, productEcosystemIntegration |
| Tooling              | technicalExcellence, agenticEmpowerment          |
| Process              | craft, worldClass                                |
| Safeguards           | compliance, trustAndSafety                       |
| Monitoring           | trustAndSafety                                   |
| Team & Ownership     | craft, commercialValue                           |

## 2. Four-artifact lifecycle (the canonical folders)

| Concept                      | Folder            | Is                                         | Naming                                                                                             |
| ---------------------------- | ----------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **audit** (assessment)       | `audit/reports/`  | how it scores + matures                    | `mpr-scorecard-YYYY-MM-DD.md`, `signal-maturity-YYYY-MM-DD.md`, `readiness-combined-YYYY-MM-DD.md` |
| **evidence** (proof)         | `audit/evidence/` | machine witnesses verifying audit + report | `mpr-repo-latest.json`, `signal-maturity-latest.json`, `<probe>-latest.json`                       |
| **handoff** (directive) ★NEW | `audit/handoff/`  | the prioritized work-order: do these next  | `handoff-YYYY-MM-DD.md`                                                                            |
| **report** (remediation)     | `reports/`        | what was actually done                     | `<action>-YYYY-MM-DD.md`                                                                           |
| **archive**                  | `audit/archive/`  | superseded, recoverable                    | `<group>-YYYY-MM-DD/`                                                                              |

`audit/handoff/` is the missing first-class concept: the audit _describes_ gaps; the
handoff _hands the repo a work order_.

## 3. Handoff synthesis (the keystone)

One unified handoff per repo, synthesized from BOTH lenses, prioritized:

1. **SIGNAL weakest-link first** — the dimension holding the overall maturity level down
   is the binding constraint (advance it to the next level). SIGNAL is built for this.
2. **then MPR threshold gaps by leverage** — pillars closest to the next threshold (85/95)
   that unblock the most downstream pillars (e.g. the compliance cap that blocks the tier).

Each handoff action is a directive line:

```
[#] <action>  — closes: <lens finding>  · gate: <threshold/level it clears>  · owner: <repo/role>  · evidence: <witness to produce>
```

The handoff is **owned by fabric-os** (the assessor), **consumed by the repo** (the doer).
It is regenerated on each audit run; closed items drop off as evidence proves the gate cleared.

## 4. Workflow (the lifecycle loop)

1. **Run audit** (fabric-os AaaS): apply MPR lens (bridge-os engine) + SIGNAL lens
   (baseline-os) → write `audit/evidence/*-latest.json` (proof) + `audit/reports/*.md` (assessment).
2. **Emit handoff** (fabric-os): synthesize findings → `audit/handoff/handoff-<date>.md` (directive).
3. **Remediate**: an agent (Class R) or repo owner (Class A/S) executes the handoff actions.
4. **Report**: `reports/<action>-<date>.md` — what was done, cites the evidence.
5. **Re-verify** (fabric-os): re-run audit → fresh evidence → handoff item auto-closes when its gate clears.

Loop cadence: witness freshness ≤ 7d; handoff regenerated on-change-or-weekly.

The loop is designed to **close on itself** (§4c). At L3 a human kicks each step; at L5 an
agent claims items, remediates, reports, and re-verification closes them unattended —
human approval only at Class A/S gates.

## 4b. Maturity ladder (current → L5 ceiling)

The design's target ceiling is **SIGNAL L5 across all 6 dimensions / MPR 95+ across all 11
pillars**. The path is explicit, not aspirational:

| SIGNAL dim           | now | the four additions (§4c) that reach L5                           |
| -------------------- | --- | ---------------------------------------------------------------- |
| Systems Architecture | L3  | schema-validated, provider-agnostic contracts                    |
| Tooling              | L1  | §4c.1 autonomous execution — agents run the loop unattended      |
| Process              | L2  | §4c.1 closed-loop self-healing — regressions auto-reopen items   |
| Monitoring           | L2  | §4c.2 predictive — trend lines, drift detection, breach forecast |
| Safeguards           | L2  | §4c.3 adversarial honesty — red-team lens + signed provenance    |
| Team & Ownership     | L1  | §4c.4 enforced ownership — CODEOWNERS-style binding + SLA        |

The moat pillars (defensiveMoat, ipMagic, agenticEmpowerment) only clear 95 once the
**self-healing closed loop** (§4c.1) exists — that loop is the thing a funded team cannot
copy in 90 days.

## 4c. L5 target architecture (the four additions)

These are first-class design elements, not future hopes — without them the design ceilings
at L3 / mid-80s.

### 4c.1 Closed-loop autonomy → Tooling/Process L5, agenticEmpowerment 95

Handoff items are **machine-executable directives** (structured: action, gate, owner,
evidence-to-produce), not prose. An agent claims an item, remediates, writes the report,
and re-verification auto-closes it. Human approval gates only at authority Class A/S
(secrets, prod, legal). This is the AI-native core — the moat lives here.

### 4c.2 Predictive monitoring → Monitoring L5

The cadence engine tracks per-pillar / per-dimension **trend lines**, detects regressions
(a closed item reopening), and **forecasts the next threshold breach**. It alerts before
failure, not after — `aaas:cadence` emits a drift/forecast witness, not just a freshness check.

### 4c.3 Adversarial honesty → Safeguards L5, trustAndSafety 95

A second independent lens **red-teams every verdict** — tries to prove it fabricated or
score-inflated. Verdicts carry **signed provenance**. The honesty gate audits itself; a
verdict that cannot survive the red-team lens is quarantined, not published.

### 4c.4 Enforced ownership → Team & Ownership L5

Every artifact + handoff item has a **codified owner** (CODEOWNERS-style binding in the
contract), an **SLA**, and an **escalation path**. Ownership is machine-checkable via
`aaas:contract:check`, not a doc convention.

## 5. Standards & protocols

- **Honesty gate** (existing): no fabricated verdicts; provisional/confidence labels carried through.
- **SIGNAL production-only**: "building toward it" scores as the current level, not target.
- **MPR thresholds**: 85 unlock (foundation), 95 world-class.
- **Ownership split**: bridge-os = MPR engine · baseline-os = SIGNAL lens · fabric-os = AaaS
  orchestrator (runs both, synthesizes handoff, enforces cadence/contract) · repo = remediation + report.
  (Depends on `XR-AGENT-CAPABILITY-OWNERSHIP-001` for the SIGNAL/agentic lens move to baseline-os.)
- **Non-destructive**: move-never-delete; superseded → `audit/archive/`; all changes git-recorded.
- **Contract**: each repo carries `machine/spec/aaas-audit-contract.pin.json`; folders provisioned
  (`audit/evidence|reports|handoff|archive`, `reports/`); conformance via `aaas:contract:check`.

## 6. Commands (canonical surface, extended)

| Command                                                       | Does                                             |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `aaas:audit --lens mpr\|signal\|all [--repo]`                 | run lens(es) → evidence + assessment             |
| `aaas:report <umbrella> [--repo]`                             | render assessment write-up                       |
| `aaas:handoff [--repo]`                                       | synthesize unified handoff from current findings |
| `aaas:report:remediation`                                     | record what was done (reports/)                  |
| `aaas:contract:check` / `aaas:cadence` / `aaas:honesty:check` | enforce conformance/freshness/honesty            |

## 7. Open dependencies

- `XR-AGENT-CAPABILITY-OWNERSHIP-001` — SIGNAL lens (agentic) → baseline-os
- `XR-AUDIT-COMMAND-RECONCILE-001` — registries → canonical surface
- SIGNAL lens implementation (the 6-dimension evaluator) does not yet exist as a runnable
  producer — this design assumes baseline-os builds it (parallel to the bridge-os MPR engine).

## Out of scope (YAGNI)

- Merging MPR/SIGNAL into one scale (rejected — they measure different things).
- Per-lens separate handoffs (rejected — repo must get ONE prioritized "what's next").
