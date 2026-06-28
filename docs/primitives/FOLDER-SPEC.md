---
title: 'primitives/ - folder provisioning'
status: draft
date: 2026-06-28
owner: fabric-os
document_type: folder-spec
tier: operating
tags: ['primitives', 'assets', 'design']
review_cycle: on-change
---

# `docs/primitives/` - Provisioning

## Purpose

`docs/primitives/` holds reusable design and asset direction for Fabric OS. It is a documentation primitive layer, not a binary media store and not a product implementation surface.

## Allowed Children

| Folder | Role |
| ------ | ---- |
| `assets/` | Generated media documentation, prompt tracks, asset governance, and asset scorecard. |
| `design/` | Design principles, aesthetics, personas, motion, tooling, and design scorecard. |

## Storage Boundary

| Content | Path |
| ------- | ---- |
| Primitive documentation | `docs/primitives/` |
| Generated media binaries | `platform/assets/generated/media/` |
| Media inventory | `machine/media/library.manifest.json` |
| Media contract | `config/genai-media-contract.json` |
