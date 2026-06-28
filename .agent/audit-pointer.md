## Audits (cross-repo)

Audits + reports are centralized as **Audit-as-a-Service (AaaS)** in `fabric-os`. One
canonical surface for the whole fleet — do **not** invoke legacy per-concern audit
commands (master-audit, product-audit, forensic-audit, ux-audit, gtm-audit,
security-audit, signal-audit, moat-check, 10-10-roadmap, five-core, …). They are
**retired** in favor of the 11-pillar MPR taxonomy.

### Standard (SoR)

`fabric-os/machine/spec/aaas-audit-taxonomy.json` — 11 MPR pillars across two tiers,
each decomposed into micro-audits:

- **Foundational:** compliance, technicalExcellence, craft, worldClass, trustAndSafety
- **Transformational:** creativityInnovation, commercialValue, defensiveMoat, agenticEmpowerment, productEcosystemIntegration, ipMagic

### Commands (SoR: `fabric-os/machine/spec/aaas-command-surface.json`)

- `aaas:audit --pillar <p> [--micro <m>] | --tier foundational|transformational | --all`
  — runs the bridge-os MPR engine (`audit:mpr:repo:run`) and presents the requested taxonomy slice.
- `aaas:report <foundational-readiness | transformational-readiness | mpr-scorecard | remediation-roadmap>`
  — rolls up engine witnesses into the four canonical reports.

### Contract

Each repo carries `machine/spec/aaas-audit-contract.pin.json` (bound to the fabric-os
contract SoR). Witnesses → `audit/evidence/`; dated reports → `audit/reports/`;
superseded → `audit/archive/`. Freshness + coverage are enforced by fabric-os
(`aaas:contract:check`, `aaas:cadence`, `aaas:honesty:check`).

### Engine + ownership

- **bridge-os** — MPR scoring engine + universal rubric.
- **canon-os** — capability registry (the coverage denominator).
- **fabric-os** — the AaaS lane: orchestration, honesty gate, cadence, contract, fleet index.

Provider-agnostic — the same surface works for Claude, Codex, Gemini, Kimi, Deepseek, Grok, or any agent.
