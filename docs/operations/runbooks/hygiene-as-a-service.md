---
title: 'Hygiene as a Service'
status: current
date: 2026-06-18
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'haas', 'hygiene', 'fabric']
review_cycle: on-change
---

# Hygiene as a Service

Fabric OS owns repo hygiene controls for the service fabric: root cleanliness,
workspace layout, generated evidence placement, and remediation tracking.

## System of Record

| Artifact         | Path                                             | Role                      |
| ---------------- | ------------------------------------------------ | ------------------------- |
| Hygiene register | `machine/hygiene-friction-register.json`         | HaaS friction state       |
| Roadmap          | `machine/haas-roadmap.json`                      | Fabric-owned HaaS roadmap |
| Root allowlist   | `docs/operations/repo/root-allowlist.json`       | Workspace root policy     |
| HaaS check       | `platform/scripts/haas-friction-check.mjs`       | Local HaaS gate           |
| Latest witness   | `audit/evidence/haas-friction-check-latest.json` | Local HaaS witness        |

## Commands

```bash
pnpm haas:friction:check
pnpm haas:friction:check:write
pnpm check:workspace-root-cleanliness:strict
```

## Rules

- Keep generated evidence under `audit/`, `machine/ci/`, or the lane-specific Ops
  path declared by the harness.
- Do not add new root files without updating the root cleanliness allowlist.
- Treat unrelated workspace churn as out of scope for lane repairs unless it
  blocks the HaaS gate.
