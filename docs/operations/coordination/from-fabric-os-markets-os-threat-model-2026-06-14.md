---
title: 'Outbound — markets-os product threat model'
status: open
date: 2026-06-14
from: fabric-os
to: markets-os
ticket: XR-MARKETS-THREAT-MODEL-001
protocol: P24
priority: P0
blocksIR: false
authorityClass: R
initiative: INIT-GTCX-INFRA-SECAS
---

# Outbound: markets-os product threat model

## Raise

`fabric-os` fleet risk check (`pnpm fleet:risk:check`) flags `RISK-PRODUCT-001` as missing its threat model. The risk is tracked in `bridge-os/pm/spec/fleet-risk-register.json` and is currently an open P0.

| Field            | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| Risk ID          | `RISK-PRODUCT-001`                                      |
| Repo owner       | `markets-os`                                            |
| Expected path    | `markets-os/docs/security/threat-model.md`              |
| Fleet witness    | `fabric-os/audit/evidence/fleet-risk-check-latest.json` |
| Related register | `bridge-os/pm/spec/fleet-risk-register.json`            |

## Required markets-os actions (Class R)

1. Create `docs/security/threat-model.md` with a STRIDE or equivalent threat model covering the markets-os surface.
2. Ensure the file is not a link stub and is ≥ 400 bytes of substantive content.
3. Run `pnpm fleet:risk:check` from `fabric-os` (or verify via CI) and confirm `RISK-PRODUCT-001` reports `status: present`.
4. File durable inbound ack: `markets-os/docs/operations/coordination/from-fabric-os-threat-model-2026-06-14.md`.

## Acceptance

- [ ] `markets-os/docs/security/threat-model.md` exists and passes the fleet risk `threatModelStatus` probe.
- [ ] `fabric-os` `pnpm fleet:risk:check` shows `productThreatModels.ok: true` (or `RISK-PRODUCT-001: present`).
- [ ] Inbound ack filed referencing `XR-MARKETS-THREAT-MODEL-001`.

## References

- `bridge-os/pm/spec/fleet-risk-register.json`
- `fabric-os/audit/evidence/fleet-risk-check-latest.json`
- `fabric-os/platform/scripts/fleet-risk-check.mjs`
