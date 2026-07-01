---
title: 'GTCX SHIP Protocol'
status: current
date: 2026-07-01
owner: fabric-os
authority: GTCX-SHIP-001
protocol_id: GTCX-SHIP-001
workflow_id: ship-release
canonical_command: pnpm ship:release
tags: [release-management, ship, dslc, institutional-readiness]
---

# GTCX SHIP Protocol

SHIP means **Sealed, Hardened, Institutionalized, and Provisioned**. It is the
final Release Management check after DSLC has passed.

DSLC answers: **“Can this release be deployed, sold, legally activated, and
communicated under the selected release class?”**

SHIP answers: **“Is this release formally shippable as an institutional GTCX v1
release?”**

SHIP consumes DSLC. It does not replace DSLC, QASC, legal review, billing
approval, public-communications approval, or product ownership.

## Gate order

```text
QASC → DSLC → SHIP → formal release / customer activation / public issuance
```

| Gate | Purpose                                                              |
| ---- | -------------------------------------------------------------------- |
| QASC | Independent quality, security, compliance, MPR, and SIGNAL assurance |
| DSLC | Deployment, Sales, Legal, and Communications readiness               |
| SHIP | Final release-management sealing against institutional v1 standards  |

## SHIP pillars

### 1. Sealed

Verified proof exists for the release unit.

Required evidence includes:

- QASC and DSLC proof pack
- DSLC ready decision at 100/100
- current machine-readable evidence chain
- release-manager attestation and rollback boundary

### 2. Hardened

Critical security, legal, and operational vulnerabilities meet the release
class control requirements.

Required evidence includes:

- critical/high security controls closed or approved as exceptions
- legal/privacy/IP/data-sharing blockers closed for applicable release classes
- deployment, rollback, observability, incident, support, and ops controls
- exception register with owner, expiry, rationale, and evidence

### 3. Institutionalized

The release meets institutional-grade GTCX v1 product standards.

Required evidence includes:

- producer/operator experience standard
- billing, payment, customer management, Revenue Ops, and FinOps standard
- onboarding, customer success, and support standard
- docs and architecture standard

Internal protocol-only releases may mark experience, billing, and onboarding
controls not-applicable only with evidence, rationale, and approver.

### 4. Provisioned

The release is properly version controlled and formally issued.

Required evidence includes:

- versioned specs
- versioned shipped surfaces and features, including SDK, CLI, desktop, cloud,
  mobile, or explicit applicability exceptions
- GitBook/public docs issuance for public/customer-facing releases
- public changelog and release notes issuance or approved non-public boundary

## Authority boundary

Agents may create and evaluate SHIP manifests, run checks, produce witnesses,
and identify blockers.

Agents may not synthesize:

- legal signatures
- revenue-recognition approval
- pricing approval
- public claims
- sovereign release-manager attestation

Those items must be recorded as evidence from the authorized owner.

## Machine contract

| Artifact                 | Path                                                      |
| ------------------------ | --------------------------------------------------------- |
| Contract                 | `machine/spec/ship-contract.json`                         |
| Manifest schema          | `machine/spec/ship-release.schema.json`                   |
| Example release manifest | `machine/ship/releases/REL-FABRIC-DSLC-001/manifest.json` |
| Contract witness         | `audit/evidence/ship-contract-check-latest.json`          |
| Release witness          | `audit/evidence/ship-release-<release-id>-latest.json`    |
| Release report           | `audit/reports/ship-decision-<release-id>-YYYY-MM-DD.md`  |

## Commands

```bash
pnpm ship:contract:check
pnpm ship:contract:check:write
pnpm ship:release -- --manifest machine/ship/releases/<release-id>/manifest.json
pnpm ship:release:write -- --manifest machine/ship/releases/<release-id>/manifest.json
pnpm ship:test
```

## Decision policy

SHIP is **ready** only when:

1. DSLC is `ready` at `100/100`.
2. Every applicable control in every required SHIP pillar is satisfied.
3. Any not-applicable control has evidence, rationale, and a named approver.

SHIP is **blocked** when an applicable Class S control is missing, blocked, or
not properly evidenced.

SHIP is **incomplete** when required Class R or Class A controls are missing or
below benchmark.

## Release-class routing

| Release class     | Required pillars                                 |
| ----------------- | ------------------------------------------------ |
| internal          | sealed, hardened, provisioned                    |
| public            | sealed, hardened, institutionalized, provisioned |
| pilot             | sealed, hardened, institutionalized, provisioned |
| customer-contract | sealed, hardened, institutionalized, provisioned |
| partnership       | sealed, hardened, institutionalized, provisioned |
| regulated-data    | sealed, hardened, institutionalized, provisioned |
| ip-bearing        | sealed, hardened, institutionalized, provisioned |

## Closeout rule

A repository may claim “v1 shipped” only when QASC, DSLC, and SHIP evidence
exist for the same release unit.
