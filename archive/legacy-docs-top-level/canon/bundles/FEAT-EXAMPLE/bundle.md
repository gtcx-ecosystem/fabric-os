---
title: 'Example feature'
document_type: canon-feature-bundle
bundleId: FEAT-EXAMPLE
version: '0.1.0'
status: draft
updated: '2026-06-17'
owner: '{repo-name}'
goalIds:
  - GOAL-EXAMPLE
milestoneIds:
  - M1
composition:
  services: []
  infra: []
  experience: []
  commercial: []
---

# Example feature

Narrative context for GitBook and reviewers. Engineering truth is in the `canon-json` blocks below — synthesized to `pm/canon/bundles/FEAT-EXAMPLE/`.

## Charter

```canon-json charter
{
  "$schema": "gtcx://canon-os/product-canon-charter/v1",
  "bundleId": "FEAT-EXAMPLE",
  "version": "0.1.0",
  "problem": "What user/system pain this feature resolves",
  "goals": ["Measurable outcome 1"],
  "nonGoals": ["Explicit out of scope"],
  "successMetrics": [
    { "id": "SM-1", "metric": "Description", "target": "value", "verify": "command or query" }
  ],
  "dependencies": [],
  "openQuestions": []
}
```

## Requirements

```canon-json requirements
{
  "$schema": "gtcx://canon-os/product-canon-requirements/v1",
  "bundleId": "FEAT-EXAMPLE",
  "version": "0.1.0",
  "functional": [
    {
      "id": "FR-EX-001",
      "statement": "The system SHALL …",
      "priority": "P0",
      "acceptance": ["Given … When … Then …"],
      "surfaces": ["surface-example"],
      "verifyCommand": "pnpm test --filter example"
    }
  ],
  "nonFunctional": []
}
```

## Experience

```canon-json experience
{
  "$schema": "gtcx://canon-os/product-canon-experience/v1",
  "bundleId": "FEAT-EXAMPLE",
  "version": "0.1.0",
  "operatorPersonas": ["OP-ANALYST"],
  "surfaces": [
    {
      "id": "surface-example",
      "route": "/example",
      "states": ["idle", "loading", "success", "error"],
      "transitions": [
        { "from": "idle", "event": "submit", "to": "loading" },
        { "from": "loading", "event": "ok", "to": "success" }
      ],
      "acceptance": ["FR-EX-001"]
    }
  ],
  "flows": [{ "id": "flow-example", "steps": ["surface-example:idle", "surface-example:success"] }],
  "narrativeRef": "docs/product/ux/flows/flow-example.md"
}
```

## Definition of done

```canon-json dod
{
  "$schema": "gtcx://canon-os/product-canon-dod/v1",
  "bundleId": "FEAT-EXAMPLE",
  "version": "0.1.0",
  "inherits": "agile/scrum/definition-of-done.md",
  "checklist": [
    {
      "id": "DOD-EX-001",
      "item": "All FR-* acceptance verified",
      "verifyCommand": "pnpm canon:bundle:check",
      "required": true
    }
  ]
}
```

## UAT

```canon-json uat
{
  "$schema": "gtcx://canon-os/product-canon-uat/v1",
  "bundleId": "FEAT-EXAMPLE",
  "version": "0.1.0",
  "scenarios": [
    {
      "id": "UAT-EX-001",
      "title": "Happy path",
      "preconditions": [],
      "steps": ["Step 1", "Step 2"],
      "expected": "Observable outcome",
      "verifyCommand": "pnpm uat:example",
      "expectedExitCode": 0
    }
  ]
}
```
