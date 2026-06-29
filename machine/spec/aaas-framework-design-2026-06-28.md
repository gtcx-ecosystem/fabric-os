# AaaS Framework Design — MPR + SIGNAL dual-lens audit lifecycle

_status: **PARKED (experimental)** · date: 2026-06-28 · owner: fabric-os_

> **PRODUCT-LEAD DECISION (2026-06-28): park this workstream.** After three self-audits, the honest
> finding is that this framework is **off-moat infrastructure** (the org moat is product/UX craft, not
> measurement infra), it has **never fulfilled its purpose** (0 handoff-driven remediations), it does
> **not run** (CI billing-locked; loop run for real once), and it was assessed **circularly** (graded by
> instruments it built). ~75 commits, zero product/user value. Do NOT invest further here without a
> concrete, user-facing reason. The code is competent and preserved; it is simply not the work.
> Re-activate only if a real consumer needs it. Pivoting to actual product value.

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

| Command                                                       | Does                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `aaas:audit --lens mpr\|signal\|all [--repo]`                 | run lens(es) → evidence + assessment                                                                   |
| `aaas:report <umbrella> [--repo]`                             | render assessment write-up                                                                             |
| `aaas:handoff [--repo] [--write]` (BUILT)                     | synthesize unified handoff (SIGNAL weakest-link first, then MPR leverage); MPR-only until SIGNAL ships |
| `aaas:report:remediation`                                     | record what was done (reports/)                                                                        |
| `aaas:contract:check` / `aaas:cadence` / `aaas:honesty:check` | enforce conformance/freshness/honesty                                                                  |

## 7. Build status + open dependencies

**Shipped (fabric-os):** contract v1.1.0 encodes the full model; `audit/handoff` enforced
fleet-wide (20/20 conformant); **handoff synthesizer (`aaas:handoff`) BUILT + tested**
(`platform/scripts/lib/aaas-handoff.mjs`, 12 tests) and proven on real fleet MPR data;
**predictive cadence (§4c.2) BUILT + tested** (`platform/scripts/lib/aaas-cadence-predict.mjs`,
12 tests) — trend lines, regression detection, breach forecasting over a history ledger,
emitting `audit/evidence/aaas-cadence-forecast-latest.json`;
**adversarial honesty (§4c.3) BUILT + tested** (`platform/scripts/lib/aaas-adversarial-honesty.mjs`,
12 tests, `aaas:honesty:adversarial`) — red-teams every MPR verdict (inflation / fabrication /
missing-provenance / self-contradiction), attaches a content-addressed provenance digest, and
quarantines verdicts that cannot survive. Already catching unevidenced scores on real fleet data.
**enforced ownership (§4c.4) BUILT + tested** (`platform/scripts/lib/aaas-ownership.mjs`, 6 tests,
`aaas:honesty:ownership`) — the contract codifies owner + SLA + escalation per artifact folder and
per handoff item; unowned type / unowned handoff item is a hard violation, SLA breaches escalate.

**All four L5 additions (§4c.1–§4c.4) are now BUILT, and the SIGNAL lens itself is now BUILT**
(`platform/scripts/lib/aaas-signal.mjs` + `aaas:signal`, 7 tests) — a reference 6-dimension
evaluator (Systems Architecture · Tooling · Process · Safeguards · Monitoring · Team & Ownership),
production-only, weakest-link, with half-levels. It writes `audit/evidence/signal-maturity-latest.json`,
which the handoff synthesizer already consumes — so the loop now runs in **full dual-lens mode**
(SIGNAL weakest-link first, then MPR gaps). fabric-os self-scores SIGNAL **L5 (PROVISIONAL)**
across all six dimensions, reached by producing the evidence the lens names (signed-provenance,
ownership, cadence-history witnesses). **Why provisional — two honest caveats from the session
self-audit:** (1) _circularity_ — the SIGNAL rubric and the repo it scores were built together, so
fabric-os passes existence-based checks because it _contains_ the framework; an independent rubric
may score differently. (2) _frozen evidence_ — Monitoring L5 rests on a committed 4-snapshot cadence
history bootstrapped at ~0d interval; delete-and-regenerate resets it below L5. The L5 is therefore
"L5-capable, evidence frozen at commit," not a reproduced standing property. Treat as provisional
until an **independent** run (foreign rubric, fresh witnesses) reproduces it.

**Open:**

- `XR-SIGNAL-LENS-TRANSFER-001` (parent `XR-AGENT-CAPABILITY-OWNERSHIP-001`) — **ownership transfer**
  of the now-built SIGNAL lens (agentic = AI-OS content) → baseline-os. Concrete handoff filed
  (`docs/operations/coordination/outbound/to-baseline-os-signal-lens-transfer-2026-06-28.md`); the
  fabric-os reference producer unblocks full operation now, so the transfer is coordination, not a blocker.
- `XR-AUDIT-COMMAND-RECONCILE-001` — registries → canonical surface
- Predictive-layer trend confidence strengthens as real cadence history accrues (mechanism is live).

## Out of scope (YAGNI)

- Merging MPR/SIGNAL into one scale (rejected — they measure different things).
- Per-lens separate handoffs (rejected — repo must get ONE prioritized "what's next").
