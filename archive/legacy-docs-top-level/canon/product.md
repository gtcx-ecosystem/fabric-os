---
title: 'fabric-os — canon product register'
document_type: canon-product
productId: 'fabric-os'
version: '0.1.0'
status: draft
updated: '2026-06-17'
owner: 'fabric-os'
---

# fabric-os

Authoring register for **product canon synthesis**. Edit this file and bundle files under `docs/canon/bundles/`; run `pnpm canon:synthesize` to refresh `pm/canon/`.

## Milestones

```canon-json milestones
[
  {
    "id": "M1",
    "title": "First shippable milestone",
    "status": "planned",
    "targetDate": "2026-09-01",
    "bundleIds": ["FEAT-EXAMPLE"]
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
