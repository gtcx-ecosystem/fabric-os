---
title: 'Primitives'
status: draft
date: 2026-06-28
owner: fabric-os
document_type: overview
tier: operating
tags: ['primitives', 'assets', 'design']
review_cycle: on-change
---

# Primitives

Fabric OS uses this layer for reusable design and asset direction that informs documentation, presentations, generated media, and operator-facing product surfaces.

Canonical source of record: `canon-os/docs/primitives/`.

| Track                        | Purpose                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| [Assets](./assets/README.md) | Media-focused documentation, generated asset governance, and image/video prompt direction. |
| [Design](./design/README.md) | Product, operational, and visual design direction for Fabric OS surfaces.                  |

Generated media binaries do not live here. Store selected generated media under `platform/assets/generated/media/` and index it in `machine/media/library.manifest.json`.
