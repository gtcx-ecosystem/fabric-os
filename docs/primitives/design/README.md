---
title: 'Design primitive'
status: draft
date: 2026-06-28
owner: fabric-os
document_type: overview
tier: operating
tags: ['design', 'primitives', 'mpr']
review_cycle: on-change
---

# Design Primitive

Fabric OS uses this primitive to standardize product, operational, and visual design direction for the AWS, Kubernetes, Terraform, deployment, and independent assurance control plane.

Canonical source of record: `canon-os/docs/primitives/design/`.

Design documentation lives here. Generated media binaries do not. Media generation and asset inventory stay under `docs/primitives/assets/`, `platform/assets/generated/media/`, and `machine/media/library.manifest.json`.

| Track                                     | Purpose                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| [Principles](./principles.md)             | Durable design laws and decision rules.                                      |
| [Goals](./goals.md)                       | Experience outcomes, quality bar, and design success measures.               |
| [Personas](./personas.md)                 | Design-facing user archetypes and implications.                              |
| [Aesthetics](./aesthetics.md)             | Visual tone, density, type, color, layout, and imagery.                      |
| [Motion](./motion.md)                     | Animation, transitions, motion safety, and code-driven video direction.      |
| [Components](./components.md)             | Component expectations and interaction patterns.                             |
| [Platform](./platform.md)                 | Surface-specific rules across web, mobile, docs, console, and presentations. |
| [Comparables](./comparables.md)           | Reference products and lessons to adopt or avoid.                            |
| [Inspiration](./inspiration.md)           | Curated moodboard and emerging reference direction.                          |
| [Tooling](./tooling.md)                   | Tool radar for design, asset, motion, and agent-assisted creation.           |
| [Tooling Security](./tooling-security.md) | Supply-chain, permission, data, and prompt-injection controls.               |
| [Scorecard](./scorecard.md)               | Design primitive readiness and MPR rollup.                                   |

## Boundary

`design/` sets design direction. `assets/` governs generated media and asset libraries. Product implementation stays in owner repos.
