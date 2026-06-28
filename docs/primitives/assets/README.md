---
title: 'Assets primitive'
status: draft
date: 2026-06-28
owner: fabric-os
document_type: overview
tier: operating
tags: ['assets', 'media', 'primitives', 'mpr']
review_cycle: on-change
---

# Assets Primitive

Fabric OS uses this primitive to standardize media-focused documentation and generated asset governance for the AWS, Kubernetes, Terraform, deployment, and independent assurance control plane.

Canonical source of record: `canon-os/docs/primitives/assets/`.

Generated media binaries do **not** live in this docs folder. Final generated images and videos live under `platform/assets/generated/media/` and are indexed in `machine/media/library.manifest.json`.

| Track | Purpose |
| ----- | ------- |
| [Images](./images.md) | Generated image categories, prompts, storage, and review rules. |
| [Video](./video.md) | B-roll, hero loops, explainers, and motion-safe generated video direction. |
| [Product Marketing](./product-marketing.md) | Product, feature, workflow, and launch visual direction. |
| [Collateral](./collateral.md) | Presentation, one-pager, case-study, sales-support, and field collateral visuals. |
| [Marketing](./marketing.md) | Website, campaign, launch, and social preview assets. |
| [Brand](./brand.md) | Visual brand guardrails for generated media. |
| [Identity](./identity.md) | People, organization, consent, representation, and identity safety. |
| [Graphics](./graphics.md) | Explainers, diagrams, report figures, and designed visuals. |
| [Icons](./icons.md) | Icon system boundaries and vector-first usage. |
| [Logos](./logos.md) | Logo usage boundaries and official-mark review rules. |
| [Scorecard](./scorecard.md) | Media asset primitive readiness and MPR rollup. |

## Storage Rule

| Content | Path |
| ------- | ---- |
| Media documentation | `docs/primitives/assets/` |
| Generated binaries | `platform/assets/generated/media/` |
| Asset inventory | `machine/media/library.manifest.json` |
| Contract pin | `config/genai-media-contract.json` |

Do not create a new root `media/` folder.
