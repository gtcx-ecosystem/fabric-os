---
title: 'FOLDER-SPEC — docs/operations/'
status: current
date: 2026-06-16
owner: fabric-os
document_type: folder-spec
tier: critical
tags: ['documentation', 'operations']
review_cycle: on-change
---

# FOLDER-SPEC — `docs/operations/`

Normative pack: [`../../pm/spec/docs-operations-pack.json`](../../pm/spec/docs-operations-pack.json)

## fabric-os layout

| Human docs                                                       | Machine register (`ops/`)         |
| ---------------------------------------------------------------- | --------------------------------- |
| `runbooks/` — deploy, incident, SRE, **security**, **assurance** | `ops/security/`, `ops/assurance/` |
| `secas/` — SecAS program, bounty policy, CSIRT                   | `ops/security/posture.json`       |
| `deployment/` — release narratives                               | `deploy/` bindings                |
| `agent-spine/` — P22, git workflow                               | `ops/pm/`, `ops/attestation/`     |
| `coordination/` — cross-repo handoffs                            | `ops/coordination/`               |

**Roadmap lanes** (not under `docs/operations/`): `docs/roadmap/gtm/`, `docs/roadmap/compliance/` — indexed from `ops/gtm/`, `ops/compliance/`.

**No prose under `ops/`** — JSON manifests and indexes only.
