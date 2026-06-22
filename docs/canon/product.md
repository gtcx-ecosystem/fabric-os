---
title: 'Fabric OS — canon product register'
document_type: canon-product
productId: fabric-os
version: '0.1.0'
status: draft
updated: '2026-06-22'
owner: fabric-os
---

# Fabric OS

Authoring register for product canon synthesis. Edit bundles under `docs/canon/bundles/`; run `pnpm canon:synthesize` to refresh `machine/canon/`.

## Milestones

```canon-json milestones
[
  {
    "id": "M1",
    "title": "Fleet ops assurance fabric",
    "status": "in_progress",
    "targetDate": "2026-09-01",
    "bundleIds": ["FEAT-FABRIC-OPS-ASSURANCE"]
  }
]
```

## Narrative index

```canon-json narrativeIndex
{
  "vision": "docs/foundation/vision.md",
  "roadmap": "docs/foundation/roadmap.md",
  "uxReadme": "docs/product/ux/README.md",
  "customersReadme": "docs/business/customers/README.md"
}
```
