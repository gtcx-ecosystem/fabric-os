# Standing vulnerability management cadence (SECAS-S4-03)

**Owner:** fabric-os · **Friction:** `SEC-VULN-01` · **Witness:** `audit/evidence/secas-vuln-cadence-latest.json`

## Weekly triage

SecOps runs **weekly vulnerability triage** (Mondays, Africa/Johannesburg) covering:

1. Fleet supply-chain rollup (`pnpm secas:supply-chain:check`)
2. Open `SEC-*` items in `pm/security-friction-register.json`
3. Accepted-risk entries with expiry review

Each triage cycle writes or refreshes the cadence witness:

```bash
pnpm secas:vuln-cadence:check:write
```

## SLA tiers

| Tier   | Scope                                 | Response | Remediation | Escalation                           |
| ------ | ------------------------------------- | -------- | ----------- | ------------------------------------ |
| **P0** | Critical production / active exploit  | 4h       | 24h         | CSIRT on-call + platform lead        |
| **P1** | High severity / fleet-wide dependency | 24h      | 72h         | SecOps weekly triage + sprint intake |
| **P2** | Moderate / low / accepted-risk track  | 7d       | 30d         | Friction register hygiene review     |

Severity alignment with dependency CVE tiers: [supply-chain-policy](./supply-chain-policy.md).

## Friction register hygiene

Every **open** or **pending** `SEC-*` friction item must have:

- **Owner:** `repo` field (owning repo)
- **Unblock action:** non-empty `infraAction`
- **Acceptance:** witness path or closure criteria

The cadence harness fails when hygiene gaps exist. Post-launch external gates (pen-test vendor report, SOC 2) remain in `ops/coordination/post-launch-external-gates.json` — not on the internal engineering roadmap.

## Witness command

```bash
pnpm secas:vuln-cadence:check:write
```

Policy JSON: `pm/spec/vuln-cadence-policy.json`.
