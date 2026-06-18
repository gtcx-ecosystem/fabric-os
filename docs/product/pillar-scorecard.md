---
title: 'pillar-scorecard — docs/product/'
status: current
date: 2026-06-16
document_type: folder-spec
tier: operating
tags: ['documentation', 'multi-pillar', 'fractal-mpr']
review_cycle: on-change
---

# Pillar scorecard — `docs/product/`

**Read-only rollup** — scores come from published MPR witnesses, not manual entry.

- Policy: [`../../canon-os/pm/spec/docs-fractal-mpr-policy.json`](../../canon-os/pm/spec/docs-fractal-mpr-policy.json)
- Pack: [`../../pm/spec/docs-product-pack.json`](../../pm/spec/docs-product-pack.json#pillarContract)
- **Layer witness (SoR):** [`audit/evidence/mpr-product-layer-latest.json`](audit/evidence/mpr-product-layer-latest.json)

**Composite target:** **85/100** per profile at layer audit order.

| Pillar               | Role      | Artifacts     | Gate               | Target |
| -------------------- | --------- | ------------- | ------------------ | ------ |
| compliance           | secondary | pack contract | MPR witness rollup | 85     |
| technicalExcellence  | secondary | pack contract | MPR witness rollup | 85     |
| craft                | primary   | pack contract | MPR witness rollup | 85     |
| worldClass           | secondary | pack contract | MPR witness rollup | 85     |
| trustAndSafety       | secondary | pack contract | MPR witness rollup | 85     |
| creativityInnovation | N/A       | pack contract | MPR witness rollup | 85     |
| commercialValue      | primary   | pack contract | MPR witness rollup | 85     |
| defensiveMoat        | secondary | pack contract | MPR witness rollup | 85     |
| agenticEmpowerment   | secondary | pack contract | MPR witness rollup | 85     |
| ecosystemIntegration | secondary | pack contract | MPR witness rollup | 85     |
| ipMagic              | primary   | pack contract | MPR witness rollup | 85     |

## Fractal rollup

| Scope  | Witness                                             |
| ------ | --------------------------------------------------- |
| File   | `audit/evidence/mpr-files/product/*.json` (planned) |
| Folder | child file witnesses                                |
| Layer  | `audit/evidence/mpr-product-layer-latest.json`      |
| Repo   | `audit/evidence/five-pillar-latest.json`            |
