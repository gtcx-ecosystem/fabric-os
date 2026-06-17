# Product capability matrix — fabric-os

> **SoR:** PRD features → shippable capabilities. Stories must trace to a row here or a `prdRef`.

## Active milestone

See `pm/spec/product-goals.json` → `activeMilestone`.

## Capability map

| Capability ID | PRD ref             | Feature              | Shippable outcome      | Status      | Witness          |
| ------------- | ------------------- | -------------------- | ---------------------- | ----------- | ---------------- |
| CAP-001       | prd-product-charter | Core product surface | Demoable operator path | in-progress | `pnpm ops:check` |

## Rules

- Every Class R ship claim maps to ≥1 capability row with acceptance evidence.
- `done` stories reference `capabilityId` or `prdRef` in auditNotes.
- Update this matrix when PRD scope changes — not backlog titles alone.
