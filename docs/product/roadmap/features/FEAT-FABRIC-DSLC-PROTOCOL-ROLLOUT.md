---
featureId: FEAT-FABRIC-DSLC-PROTOCOL-ROLLOUT
initiativeId: INIT-FABRIC-RELEASE-TO-REVENUE
title: 'FEAT-FABRIC-DSLC-PROTOCOL-ROLLOUT — release-to-revenue operating protocol'
owner: fabric-os
status: active
priority: P0
version: 1.0.0
date: 2026-07-01
updated: 2026-07-01
document_type: prd
tier: product
tags: [fabric-os, dslc, deployment, sales, legal, communications]
review_cycle: on-change
authority: product-intent
---

# Fabric DSLC Protocol Rollout

## Problem

QASC establishes quality, security, and compliance assurance, but it does not
coordinate the complete operating lifecycle after implementation: deployment,
release management, commercial activation, agreements, billing/revenue
operations, controlled communications, and post-launch reconciliation.

Without one release identity and evidence contract, these functions operate
through disconnected documents and systems, producing unclear blockers,
duplicated approvals, unsupported claims, missed billing events, and incomplete
release closure.

## Intended Outcome

Every material release, pilot, customer activation, partnership, public launch,
regulated-data change, or IP-bearing package uses one DSLC manifest. The
manifest consumes QASC evidence, selects a release class, evaluates only
applicable lane controls, records authority and evidence, and produces a
deterministic readiness decision.

## Delivery Slices

| Slice    | Scope                                                  | Exit evidence                        |
| -------- | ------------------------------------------------------ | ------------------------------------ |
| DSLC-001 | Canonical protocol, contract, schema, validator, tests | `pnpm dslc:test`                     |
| DSLC-002 | Real internal fabric-os release pilot                  | DSLC release witness                 |
| DSLC-003 | Commercial pilot on one markets/ledger release         | D/S/L/C lane evidence                |
| DSLC-004 | Regulated-data release pilot                           | legal/privacy applicability evidence |
| DSLC-005 | Owner-ring adoption and contract pins                  | consumer checks                      |
| DSLC-006 | Fleet scorecard, cadence, and metrics                  | fleet witness/report                 |

## Acceptance Criteria

- DSLC has a versioned human and machine contract.
- DSLC explicitly consumes rather than duplicates QASC.
- Release classes deterministically select required lanes.
- Deployment, Sales, Legal, and Communications controls are machine-readable.
- Required controls cannot be dismissed as not applicable without rationale,
  named approval, and evidence.
- Class S legal/financial decisions remain human-owned.
- A validator emits a scored witness and nonzero exit below benchmark.
- One real release is piloted before fleet-wide enforcement.
- Consumer repos reference the canonical contract rather than copying it.

## Non-Goals

- Replacing CRM, billing, contract lifecycle, CI/CD, deployment, or content
  management systems.
- Storing secrets, payment data, privileged legal advice, or raw customer data.
- Treating every legal or communications task as an engineering release gate.
- Allowing self-audit to make legal, revenue-recognition, or public-disclosure
  decisions.
