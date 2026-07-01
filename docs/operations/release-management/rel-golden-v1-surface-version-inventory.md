---
title: 'REL-GOLDEN-V1 surface and feature version inventory'
status: draft
date: 2026-07-01
owner: release-management
release: REL-GOLDEN-V1
authority: GTCX-SHIP-001
---

# REL-GOLDEN-V1 Surface and Feature Version Inventory

## Release unit

`REL-GOLDEN-V1` is a pilot-class proof pack with `markets-os` as the head
product candidate. This inventory records surfaces that must be bound before
SHIP can become ready.

## Surface inventory

| Surface                   | Status                | Version evidence required                                         |
| ------------------------- | --------------------- | ----------------------------------------------------------------- |
| Cloud / API               | pending binding       | deployed service/version, route, environment, and rollback target |
| CLI                       | pending applicability | CLI package/version or explicit not-applicable approval           |
| SDK                       | pending applicability | SDK package/version or explicit not-applicable approval           |
| Desktop                   | pending applicability | desktop build/version or explicit not-applicable approval         |
| Mobile                    | pending applicability | mobile build/version or explicit not-applicable approval          |
| Docs / GitBook            | pending approval      | issued GitBook/public-docs version                                |
| Changelog / release notes | pending approval      | issued changelog/release-note entry                               |

## Current versioned artifacts

- DSLC manifest: `machine/dslc/releases/REL-GOLDEN-V1/manifest.json`
- SHIP manifest: `machine/ship/releases/REL-GOLDEN-V1/manifest.json`
- Fleet audit: `audit/reports/dslc-ship-fleet-audit-2026-07-01.md`
- Release-management proof pack: `docs/operations/release-management/rel-golden-v1-proof-pack.md`

## Completion rule

This inventory satisfies the SHIP requirement that surfaces/features are
explicitly inventoried. It does not satisfy public docs/changelog issuance or
release-manager attestation. Those remain Class A approval gates.
