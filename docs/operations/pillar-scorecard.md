---
title: 'pillar-scorecard — docs/operations/'
status: current
date: 2026-06-16
owner: fabric-os
document_type: folder-spec
tier: operating
tags: ['documentation', 'multi-pillar', 'fractal-mpr']
review_cycle: on-change
---

# Pillar scorecard — `docs/operations/`

**Read-only rollup** — scores come from published MPR witnesses, not manual entry.

- Policy: [`../../canon-os/pm/spec/docs-fractal-mpr-policy.json`](../../canon-os/pm/spec/docs-fractal-mpr-policy.json)
- Pack: [`../../pm/spec/docs-operations-pack.json`](../../pm/spec/docs-operations-pack.json#pillarContract)
- **Layer witness (SoR):** [`audit/evidence/mpr-operations-layer-latest.json`](../../audit/archive/legacy-docs-audit/archive/legacy-docs-audit/archive/legacy-docs-audit/archive/legacy-docs-audit/evidence/mpr-operations-layer-latest.json)

**Composite target:** **85/100** per profile at layer audit order.

| Pillar               | Role      | Artifacts     | Gate               | Target |
| -------------------- | --------- | ------------- | ------------------ | ------ |
| compliance           | secondary | pack contract | MPR witness rollup | 85     |
| technicalExcellence  | primary   | pack contract | MPR witness rollup | 85     |
| craft                | secondary | pack contract | MPR witness rollup | 85     |
| worldClass           | primary   | pack contract | MPR witness rollup | 85     |
| trustAndSafety       | primary   | pack contract | MPR witness rollup | 85     |
| creativityInnovation | N/A       | pack contract | MPR witness rollup | 85     |
| commercialValue      | secondary | pack contract | MPR witness rollup | 85     |
| defensiveMoat        | secondary | pack contract | MPR witness rollup | 85     |
| agenticEmpowerment   | secondary | pack contract | MPR witness rollup | 85     |
| ecosystemIntegration | secondary | pack contract | MPR witness rollup | 85     |
| ipMagic              | N/A       | pack contract | MPR witness rollup | 85     |

## Fractal rollup

| Scope  | Witness                                                |
| ------ | ------------------------------------------------------ |
| File   | `audit/evidence/mpr-files/operations/*.json` (planned) |
| Folder | child file witnesses                                   |
| Layer  | `audit/evidence/mpr-operations-layer-latest.json`      |
| Repo   | `audit/evidence/five-pillar-latest.json`               |
