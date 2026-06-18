---
title: 'Supply-chain CVE policy'
status: current
date: 2026-06-18
owner: fabric-os
document_type: policy
tier: operating
tags: ['operations', 'secops', 'supply-chain', 'cve']
review_cycle: on-change
---

# Supply-chain CVE policy

Fabric OS owns the supply-chain security policy for shared infrastructure,
deployment, and fleet observation. Product repos retain ownership of their
application dependencies while exposing CI evidence to the Fabric rollup.

## Severity tiers

| Tier     | Definition                                                                   | Fabric handling                                 |
| -------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| Critical | Known exploited or remote-code-execution path in runtime dependency          | Immediate owner notification and patch witness  |
| High     | Exploitable package, image, or workflow vulnerability with reachable surface | Patch in active sprint or record risk exception |
| Medium   | Non-critical vulnerable component or defense-in-depth gap                    | Track in friction register                      |
| Low      | Informational or non-runtime exposure                                        | Monitor through routine dependency cadence      |

## Fleet rollup

The supply-chain rollup probes `fabric-os`, `markets-os`, `compliance-os`, and
`terminal-os` for package manifests, lockfiles, and CI evidence. Partial package
registry failures are acceptable only when lockfiles and CI witnesses are
present.

## CI witness

Each probed repo must expose at least one supply-chain signal in CI, such as
`pnpm audit`, `trivy`, `audit-with-acceptance`, `dependency-audit`, or an
equivalent validation hook in the repo validation harness.

## SLA

Critical vulnerabilities require same-day triage and a dated witness. High
vulnerabilities require remediation or explicit risk acceptance in the active
sprint. Medium and low vulnerabilities are handled through the normal security
friction register cadence unless a regulator, customer, or incident raises the
severity.

## Commands

```bash
pnpm secas:supply-chain:check
pnpm secas:supply-chain:check:write
```
