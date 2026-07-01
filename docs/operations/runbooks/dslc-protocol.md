---
title: 'GTCX Deployment, Sales, Legal, and Communications Protocol'
status: current
date: 2026-07-01
owner: fabric-os
document_type: operating-protocol
tier: critical
authority: fabric-os lifecycle orchestration; canon-os governance; sovereign humans for legal and public authority
version: 1.0.0
review_cycle: on-change
protocol_id: GTCX-DSLC-001
workflow_id: dslc-release
canonical_command: pnpm dslc:release
tags: [fabric-os, deployment, sales, legal, communications]
---

# GTCX Deployment, Sales, Legal, and Communications Protocol

| Field             | Value                             |
| ----------------- | --------------------------------- |
| Protocol ID       | `GTCX-DSLC-001`                   |
| Workflow ID       | `dslc-release`                    |
| Canonical command | `pnpm dslc:release`               |
| Machine contract  | `machine/spec/dslc-contract.json` |

DSLC is the release-to-revenue operating protocol for a GTCX release unit: a
versioned product or service release, pilot, customer activation, partnership,
public launch, regulated-data change, or IP-bearing package.

QASC answers **“is the implementation independently assured?”** DSLC answers
**“can this release be deployed, commercially activated, legally enabled,
communicated, measured, and closed?”** DSLC consumes QASC evidence; it does not
rescore or weaken QASC.

## Design Determination

DSLC uses four parallel lanes with one release manifest:

```text
                       QASC 100 / SIGNAL L5
                                |
                                v
Release intake -> classification -> lane controls -> release decision
                                      |  |  |  |
                                      D  S  L  C
                                      |  |  |  |
                                      +--+--+--+--> launch/activate
                                                        |
                                                        v
                                             measure/reconcile/close
```

The manifest classifies the release before controls are evaluated. The class
determines which lanes are required. This prevents an internal engineering
deployment from waiting on a press release, while ensuring a customer pilot
cannot activate without its commercial and legal operating controls.

## Non-Negotiables

1. Use one stable `releaseId` across deployment, CRM/billing, agreements,
   communications, evidence, and post-launch reporting.
2. QASC at 100/100 and SIGNAL L5 is mandatory for every deployment lane.
3. Required controls must be `satisfied` or have a governed
   `not-applicable` determination with rationale, approver, and evidence. A bare
   waiver never passes.
4. External signatures, legal determinations, pricing exceptions,
   revenue-recognition decisions, and public disclosure authority are never
   synthesized by an agent.
5. Sales, legal, and communications block only the activation they govern.
   They do not silently become product-engineering blockers.
6. Store references, hashes, IDs, and redacted evidence. Never commit secrets,
   unredacted customer data, payment credentials, privileged legal advice, or
   draft filings that require restricted custody.
7. Preserve segregation of duties for sovereign approvals.
8. A release is not closed until deployment outcome, billing/revenue
   reconciliation where applicable, customer ownership, communications
   archive, and renewal/retirement disposition are recorded.

## Release Classes

| Class               | Required lanes | Typical use                                     |
| ------------------- | -------------- | ----------------------------------------------- |
| `internal`          | D              | Internal service or infrastructure release      |
| `public`            | D + C          | Public product or capability launch             |
| `pilot`             | D + S + L + C  | Named-customer pilot or EAP                     |
| `customer-contract` | D + S + L      | Paid customer activation                        |
| `partnership`       | S + L + C      | Commercial/institutional partnership            |
| `regulated-data`    | D + L + C      | Material regulated-data processing change       |
| `ip-bearing`        | D + L + C      | Patentable, licensable, or protected IP release |

If one release has multiple characteristics, select the most restrictive class
or split it into linked release manifests. Do not suppress a required control
by choosing a weaker class.

## Lifecycle

| Stage                        | Outcome                                                  | Required record            |
| ---------------------------- | -------------------------------------------------------- | -------------------------- |
| 0. Intake and classification | Stable release identity, owner, class, scope             | DSLC manifest              |
| 1. Plan and authorize        | Timeline, environments, commercial/legal/comms owners    | owners and target date     |
| 2. Develop and prepare       | Versioned build plus parallel lane preparation           | build and lane evidence    |
| 3. Verify release candidate  | QASC 100, SIGNAL L5, release candidate provenance        | QASC witness reference     |
| 4. Lane readiness            | Every applicable D/S/L/C control has evidence            | scored lane controls       |
| 5. Release decision          | Authority classes and binding blockers resolved          | DSLC decision witness      |
| 6. Launch and activate       | Deployment and governed activation executed              | deploy/CRM/legal/comms IDs |
| 7. Operate and reconcile     | SLO, adoption, billing, revenue/FinOps, customer outcome | operating evidence         |
| 8. Renew, iterate, or retire | Explicit next disposition and archive                    | closure record             |

Stages 2 through 4 are concurrent. DSLC is not a sequential document queue.

## Lane D — Deployment

Deployment covers development completion, release management, QA consumption,
CI/build provenance, environment readiness, rollout, rollback, observability,
and post-deploy verification.

Required evidence includes:

- Release scope, semantic version or immutable revision, and change owner.
- CI/build artifact provenance and dependency/supply-chain result.
- Current QASC repository/package evidence at benchmark.
- Configuration, secret-binding names, database migrations, and compatibility.
- Release notes and operator/customer-facing runbook as applicable.
- Rollout strategy, rollback trigger, rollback procedure, and authority.
- Dashboards, alerts, SLO/error budget impact, incident owner, and support path.
- Post-deploy smoke/transaction verification and deployment evidence ID.

Production execution remains on the owning deployment plane. In fabric-os this
means AWS CodeBuild in the VPC and Argo CD/EKS where those contracts apply.

## Lane S — Sales and Revenue Operations

Sales covers the operational path from offer to cash and renewal:

- Offer, SKU, packaging, approved price, currency, tax, discount authority.
- CRM account, opportunity, stage, owner, forecast category, and next action.
- Quote/order form, payment method, invoice schedule, collections ownership.
- Customer onboarding, customer success, support tier, escalation, and SLA.
- Revenue recognition and revenue/FinOps reconciliation references.
- Renewal, expansion, usage review, churn risk, and close/loss disposition.

Payment credentials and full customer financial records stay in their owner
systems. DSLC stores only redacted identifiers and evidence references.

## Lane L — Legal

Legal begins with an applicability matrix. The release manifest references only
the instruments that apply:

- NDA, MOU, LOI, pilot agreement, partnership framework/agreement.
- Terms of service, privacy policy, DPA, data-sharing agreement, SCC or
  jurisdiction-specific instrument.
- IP provenance, ownership, license compatibility, protection strategy, and
  filing reference.
- Code of conduct and incorporated operating policies.
- Counterparty identity, signatory authority, effective date, term, renewal,
  termination, governing law, and custody location.

Agents may draft and validate completeness. Legal determinations, privileged
advice, filings, and signatures remain Class S. DSLC records the human decision
and artifact reference; it never fabricates assent.

## Lane C — Communications

Communications covers controlled internal, sales, partner, customer, and public
messages:

- Audience, message, substantiated claims, prohibited claims, and proof links.
- Sales email sequences/scripts and objection handling.
- Battle cards, one-pagers, tear sheets, and public business overview.
- Press release or public disclosure where applicable.
- Legal, privacy, security, partner, customer-name, and IP claims review.
- Distribution owner, channel, embargo, calendar, localization, and archive.

Every public claim must be traceable to current product, assurance, commercial,
or legal evidence. Draft language is not authority to publish.

## Decision and Authority Model

| Action                                           | Class  | Rule                                           |
| ------------------------------------------------ | ------ | ---------------------------------------------- |
| Validate manifest, evidence, CI, QA, QASC, links | R      | Agent executes                                 |
| Execute pre-authorized deployment/rollback       | A      | Requires deployment artifact and custody       |
| Approve price/discount/payment exception         | A or S | Per commercial authority matrix                |
| Execute NDA/MOU/contract/DPA/filing              | S      | Sovereign human only                           |
| Make legal determination or recognize revenue    | S      | Qualified human authority                      |
| Publish approved external communication          | A      | Requires approved claims/distribution artifact |

A control blocks release only if it is required by the selected release class
or explicitly bound in the versioned manifest. External calendars remain
visible but do not freeze unrelated engineering work.

## Manifest and Evidence Contract

Canonical manifest:

```text
machine/dslc/releases/<release-id>/manifest.json
```

Minimal structure:

```json
{
  "schema": "gtcx://fabric-os/dslc-release-manifest/v1",
  "releaseId": "REL-EXAMPLE-001",
  "repo": "fabric-os",
  "releaseClass": "internal",
  "title": "Example internal release",
  "owner": "platform-engineering",
  "qasc": {
    "score100": 100,
    "signalLevel": "L5",
    "evidence": "audit/evidence/qasc-repo-latest.json"
  },
  "lanes": {
    "deployment": { "owner": "platform-engineering", "controls": [] },
    "sales": { "owner": "commercial-ops", "controls": [] },
    "legal": { "owner": "legal-ops", "controls": [] },
    "communications": { "owner": "communications", "controls": [] }
  }
}
```

Each control record contains `id`, `status`, `evidence[]`, and optional
`rationale` and `approver`. A required `not-applicable` control counts only when
all three exception fields are present: non-empty evidence, a concrete
rationale, and a named approver. Evidence should be durable paths, system record
IDs, commit/build/deployment IDs, or redacted witness references.

Generated evidence:

```text
audit/evidence/dslc-contract-check-latest.json
audit/evidence/dslc-release-<release-id>-latest.json
audit/reports/dslc-decision-<release-id>-YYYY-MM-DD.md
```

## Commands

```bash
pnpm dslc:contract:check
pnpm dslc:contract:check:write
pnpm dslc:release -- --manifest machine/dslc/releases/<release-id>/manifest.json
pnpm dslc:release:write -- --manifest machine/dslc/releases/<release-id>/manifest.json
pnpm dslc:test
```

The evaluator exits zero only when QASC and every required lane control are at
benchmark. Incomplete and blocked releases still produce evidence in write
mode.

## Rollout

1. **Owner ring:** fabric-os owns runtime and evidence; canon-os reviews
   governance; agile-os binds ceremonies; bridge-os exposes metadata.
2. **Commercial pilot ring:** markets-os, ledger-os, ledger-ui, and terminal-os
   evaluate one real release each.
3. **Regulated operations ring:** compliance-os, terra-os, inspection-os, and
   exploration-os validate regulated-data and agreement applicability.
4. **Fleet expansion:** add repositories only after real-manifest evidence,
   command consumption, and ownership gaps are documented.

Adoption copies the contract pin and command consumption only. Consumer repos
must not fork or restate the canonical protocol.

## Success Measures

- Percentage of releases with a manifest before release decision.
- QASC-to-deployment lead time and rollback rate.
- Offer-to-contract, contract-to-cash, invoice aging, and renewal outcomes.
- Agreement cycle time and expired/missing-instrument rate.
- Claims with current substantiation and unauthorized-publication rate.
- Post-launch reconciliation and closure completed within the defined window.
