---
title: SECAS-S4 — Security engineering operating program
status: current
date: 2026-06-14
owner: fabric-os
initiative: INIT-GTCX-INFRA-SECAS
protocol: P42-SECURITY-AS-A-SERVICE
dependsOn: SECAS-S2-01
---

# SECAS-S4 — World-class security engineering (beyond pen-test)

> **Position:** Pen-test (`SECAS-S2`) is **external validation**. S4 is the **standing security engineering function** — CSIRT, supply chain, vuln cadence, remediation — mirroring how compliance-os runs **INT-REF** reference-grade lifts parallel to legal attestation.

## Institutional mirror (compliance ↔ security)

| Function        | Compliance parallel      | Security (SECaaS)                        |
| --------------- | ------------------------ | ---------------------------------------- |
| Persona         | `compliance-officer`     | `security-engineer`                      |
| Execution owner | compliance-os            | **fabric-os**                            |
| Program office  | bridge-os assurance      | bridge-os `ecosystem:secas:*`            |
| Class S gates   | Legal / auditor sign-off | SOW, SOC 2, accepted-risk                |
| Class R ops     | INT-REF dimension lifts  | SECAS-S4 stories + friction register     |
| Product repos   | App compliance controls  | App security (`09-security/`) + handoffs |

## Sprint goal

Move from **point-in-time pen-test** to **continuous security engineering**:

1. **CSIRT / SOC operating model** — who responds, how we escalate, drill evidence
2. **Supply-chain gates** — fleet CVE policy with machine witness
3. **Vuln management cadence** — weekly triage, SLA tiers, friction hygiene
4. **Pen-test remediation** — findings → owners → closure (after S2 ingest)
5. **Card expansion** — terminal-os, fabric-os, bridge-os stack security surfaces

## Stories (SoR: `pm/secas-stories.json`)

| ID          | Title                                    | Priority | Starts when                       |
| ----------- | ---------------------------------------- | -------- | --------------------------------- |
| SECAS-S4-01 | CSIRT / SOC operating model + IR runbook | P0       | S4 kickoff (parallel to S2 close) |
| SECAS-S4-02 | Fleet supply-chain security gates        | P0       | Immediately (no vendor dep)       |
| SECAS-S4-03 | Vuln management cadence                  | P1       | S4 kickoff                        |
| SECAS-S4-04 | Pen-test findings remediation            | P0       | **After** vendor report ingest    |
| SECAS-S4-05 | Expand SECaaS cards                      | P2       | S4 kickoff                        |

## Authority split (unchanged from P42)

| Class | Examples in S4                                                        |
| ----- | --------------------------------------------------------------------- |
| **R** | Runbook publish, harness checks, card updates, drill scheduling       |
| **A** | Drill execution witness, supply-chain gate write, remediation closure |
| **S** | Accepted-risk sign-off for critical findings, IR external counsel     |

**`blocksIR: false`** — product engineering continues; security engineering runs in fabric-os.

## Product interface

1. App-level findings remediated in **owner repo**
2. Stack / fleet findings remediated in **fabric-os**
3. Handoff: `to-fabric-os-security-*` / seal: `from-fabric-os-security-*`
4. Re-probe: product `09-security/` smoke after fabric seal

## Harness targets (to implement in S4 stories)

```bash
pnpm secas:csirt:check:write          # SECAS-S4-01
pnpm secas:supply-chain:check:write # SECAS-S4-02
pnpm secas:vuln-cadence:check:write   # SECAS-S4-03
pnpm secas:pentest:remediation:check:write  # SECAS-S4-04 (post-ingest)
```

## Operator entry

- **IR runbook:** [runbooks/incident-response.md](./runbooks/incident-response.md)
- **Friction SoR:** `pm/security-friction-register.json` — `SEC-CSIRT-01`, `SEC-SUPPLY-01`, `SEC-VULN-01`, `SEC-PTREM-01`
- **P22:** Remains `SECAS-S2-01` until calendar gate clears; S4 stories are **queued**, not head
