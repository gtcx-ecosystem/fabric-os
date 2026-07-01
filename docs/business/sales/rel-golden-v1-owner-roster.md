---
title: 'REL-GOLDEN-V1 owner roster'
status: current
date: 2026-07-01
owner: fabric-os
document_type: release-evidence
review_cycle: on-change
release: REL-GOLDEN-V1
---

# REL-GOLDEN-V1 Owner Roster

This roster assigns internal operating ownership for the `REL-GOLDEN-V1` pilot
proof pack. It does not create a customer record, approve pricing, or execute a
commercial agreement.

## Scope

- Release unit: `REL-GOLDEN-V1`
- Product repo: `markets-os`
- Release class: pilot
- Proof-pack owner: `gtcx-release-management`
- Commercial lane owner: `commercial-ops`
- Customer success lane owner: `customer-success-ops`
- Support lane owner: `support-ops`
- Release operations owner: `fabric-os`

## Assigned owner model

| Function                       | Owner                     | Status   | Boundary                                     |
| ------------------------------ | ------------------------- | -------- | -------------------------------------------- |
| Release proof-pack custody     | `gtcx-release-management` | assigned | Can maintain manifests, witnesses, and docs  |
| Pilot onboarding sequence      | `customer-success-ops`    | assigned | Cannot start without customer/legal approval |
| Pilot support intake           | `support-ops`             | assigned | Handles internal support path until customer |
| Technical escalation           | `fabric-os`               | assigned | Handles release evidence and platform gates  |
| Product escalation             | `markets-os`              | assigned | Owns product behavior and product evidence   |
| Commercial account/opportunity | `commercial-ops`          | pending  | Requires named CRM/customer record           |
| Pricing/SKU/discount authority | `commercial-ops`          | pending  | Requires Class A commercial approval         |
| Legal counterparty/signatory   | sovereign human           | blocked  | Requires executed legal instrument           |

## Onboarding and support path

1. Commercial owner records the account/opportunity and links the pilot packet.
2. Legal owner attaches executed NDA/MOU/pilot agreement evidence.
3. Customer success owner schedules pilot kickoff and maps participant roles.
4. Support owner opens an internal support queue and escalation route.
5. Fabric-os owner refreshes DSLC and SHIP witnesses after evidence lands.

## Evidence boundary

This document satisfies internal assignment for onboarding, success, support,
and escalation readiness. It does not satisfy the separate
`crm-account-opportunity-owner` control because no named customer/account record
is present in this repository.
