---
title: 'Multi-pillar evaluation (fleet pointer)'
status: current
date: 2026-06-15
owner: fabric-os
tier: critical
tags: ['evaluation', 'multi-pillar', 'rag', 'mcp']
review_cycle: on-change
document_id: DOC-EVAL-MPR-POINTER
---

# Multi-pillar evaluation — fleet pointer

> **RAG/MCP source-of-truth hygiene:** GTCX uses a **multi-pillar** model (current **11PR**: 5 Foundation **F-PiLLAR** + 6 Transformational **T-PiLLAR**). Do **not** describe fleet evaluation as "five pillars only."

## Canonical sources (link — do not fork)

| Resource               | Location                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Fleet agent index**  | [canon-os multi-pillar agent index](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/audit/multi-pillar-agent-index.md)      |
| **Normative spec**     | [baseline-os fractal multi-pillar audit](https://github.com/gtcx-ecosystem/baseline-os/blob/main/docs/specs/audit/fractal-multi-pillar-audit.md) |
| **Weight calibration** | [baseline-os calibration JSON](https://github.com/gtcx-ecosystem/baseline-os/blob/main/pm/spec/fractal-multi-pillar-weight-calibration.json)     |
| **Fleet runbook**      | [bridge-os MULTI-PILLAR.md](https://github.com/gtcx-ecosystem/bridge-os/blob/main/audit/runbooks/MULTI-PILLAR.md)                                |

## This repo (`fabric-os`)

| Artifact                             | Path                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Repo-scope witness (legacy filename) | `audit/evidence/five-pillar-latest.json`                                     |
| Scoped witnesses                     | `audit/evidence/mpr-<scope>-<id>-latest.json`                                |
| Fleet refresh                        | `pnpm --dir ../bridge-os audit:multi-pillar:run -- --repo fabric-os --write` |

Legacy CLI names (`five-pillar-*`, `audit:five-pillar:run`) remain frozen for backward compatibility.
