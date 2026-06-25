---
title: 'Integrator pilot readiness'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['assurance', 'pilot', 'fleet']
review_cycle: on-change
---

# Integrator pilot readiness

fabric-os owns fleet substrate readiness for the integrator pilot.

## Active blockers

See `docs/operations/coordination/fabric-os-fleet-unblock-register-2026-06-25.md`:

- FB-001 — markets-os staging API credential chain (in_progress)
- FB-002 — griot-ai HTTPS ACM cert + listener (open)
- FB-003 — griot-ai live staging substrate witness (open)

## Readiness witness

- `audit/evidence/fleet-clean-audit-2026-06-25.json`
- `audit/evidence/central-assurance-program-latest.json`

## Authority

FB-001 is Class A (operator secret population). FB-002/FB-003 are Class A infrastructure gates.
