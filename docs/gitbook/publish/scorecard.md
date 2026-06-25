---
title: 'scorecard — docs/gitbook/publish/'
status: current
date: 2026-06-16
owner: fabric-os
document_type: folder-spec
tier: operating
tags: ['documentation', 'multi-pillar', 'fractal-mpr']
review_cycle: on-change
---

# Pillar scorecard — `docs/gitbook/publish/`

**Read-only rollup** — scores come from published MPR witnesses, not manual entry.

- Policy: [`../../canon-os/pm/spec/docs-fractal-mpr-policy.json`](../../canon-os/pm/spec/docs-fractal-mpr-policy.json)
- Pack: [`../../pm/spec/docs-publishing-pack.json`](../../pm/spec/docs-publishing-pack.json#pillarContract)
- **Layer witness (SoR):** [`audit/evidence/mpr-publishing-layer-latest.json`](audit/evidence/mpr-publishing-layer-latest.json)

**Composite target:** **85/100** per profile at layer audit order.

| Pillar               | Role      | Artifacts     | Gate               | Target |
| -------------------- | --------- | ------------- | ------------------ | ------ |
| compliance           | secondary | pack contract | MPR witness rollup | 85     |
| technicalExcellence  | secondary | pack contract | MPR witness rollup | 85     |
| craft                | secondary | pack contract | MPR witness rollup | 85     |
| worldClass           | secondary | pack contract | MPR witness rollup | 85     |
| trustAndSafety       | secondary | pack contract | MPR witness rollup | 85     |
| creativityInnovation | N/A       | pack contract | MPR witness rollup | 85     |
| commercialValue      | secondary | pack contract | MPR witness rollup | 85     |
| defensiveMoat        | secondary | pack contract | MPR witness rollup | 85     |
| agenticEmpowerment   | secondary | pack contract | MPR witness rollup | 85     |
| ecosystemIntegration | primary   | pack contract | MPR witness rollup | 85     |
| ipMagic              | N/A       | pack contract | MPR witness rollup | 85     |

## Fractal rollup

| Scope  | Witness                                                |
| ------ | ------------------------------------------------------ |
| File   | `audit/evidence/mpr-files/publishing/*.json` (planned) |
| Folder | child file witnesses                                   |
| Layer  | `audit/evidence/mpr-publishing-layer-latest.json`      |
| Repo   | `audit/evidence/five-pillar-latest.json`               |
