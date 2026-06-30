---
title: Fabric ops assurance
document_type: canon-feature-bundle
bundleId: FEAT-FABRIC-OPS-ASSURANCE
version: 0.1.0
status: in_progress
updated: 2026-06-22
owner: fabric-os
initiative: INIT-GTCX-INFRA-SECAS
goalIds: ['GOAL-FABRIC-OPS']
milestoneIds: ['M1']
composition: []
services: []
infra: []
experience: []
commercial: []
planRef: docs/product/roadmap/features/FEAT-FABRIC-OPS-ASSURANCE.md
date: 2026-06-24
tier: product
tags: [fabric-os, roadmap]
review_cycle: on-change
---

# FEAT-FABRIC-OPS-ASSURANCE — engineering contract

Fleet assurance fabric — `fabric:ops:check`, friction registers, attestation evidence paths.

**Plan SoR:** [`../../product/roadmap/features/FEAT-FABRIC-OPS-ASSURANCE.md`](../../roadmap/features/FEAT-FABRIC-OPS-ASSURANCE.md)

## Charter

```canon-json charter
{
  "$schema": "gtcx://canon-os/product-canon-charter/v1",
  "bundleId": "FEAT-FABRIC-OPS-ASSURANCE",
  "version": "0.1.0",
  "problem": "Fleet repos lack a single verifier for operational contract alignment (ops domains, legal, attestation paths).",
  "goals": ["Every fleet repo passes fabric:ops-contracts:check against fabric-os central contract"],
  "nonGoals": ["Product feature delivery", "ZenHub ceremony ownership"],
  "successMetrics": [
    {
      "id": "SM-FOA-1",
      "metric": "Fleet ops contract pass rate",
      "target": "19/19 repos",
      "verify": "pnpm fabric:ops-contracts:check"
    }
  ],
  "dependencies": ["fabric-os/operations/fabric-contract.json"],
  "openQuestions": []
}
```

## Requirements

```canon-json requirements
{
  "$schema": "gtcx://canon-os/product-canon-requirements/v1",
  "bundleId": "FEAT-FABRIC-OPS-ASSURANCE",
  "version": "0.1.0",
  "functional": [
    {
      "id": "FR-FOA-001",
      "statement": "The fabric verifier SHALL resolve ops and operations alias paths for fleet repos.",
      "priority": "P0",
      "acceptance": ["Given a repo with operations/fabric-contract.json When fabric:ops-contracts:check runs Then exit 0"],
      "surfaces": ["surface-fabric-ops-check"],
      "verifyCommand": "pnpm fabric:ops-contracts:check"
    }
  ],
  "nonFunctional": []
}
```

## Experience

```canon-json experience
{
  "$schema": "gtcx://canon-os/product-canon-experience/v1",
  "bundleId": "FEAT-FABRIC-OPS-ASSURANCE",
  "version": "0.1.0",
  "operatorPersonas": ["platform-architect"],
  "surfaces": [
    {
      "id": "surface-fabric-ops-check",
      "route": "cli:fabric:ops:check",
      "states": ["idle", "running", "pass", "fail"],
      "transitions": [
        { "from": "idle", "event": "run", "to": "running" },
        { "from": "running", "event": "green", "to": "pass" }
      ],
      "acceptance": ["FR-FOA-001"]
    }
  ],
  "flows": [{ "id": "flow-ops-verify", "steps": ["surface-fabric-ops-check:idle", "surface-fabric-ops-check:pass"] }],
  "narrativeRef": "docs/operations/README.md"
}
```

## Definition of done

```canon-json dod
{
  "$schema": "gtcx://canon-os/product-canon-dod/v1",
  "bundleId": "FEAT-FABRIC-OPS-ASSURANCE",
  "version": "0.1.0",
  "inherits": "agile/scrum/definition-of-done.md",
  "checklist": [
    {
      "id": "DOD-FOA-001",
      "item": "fabric:ops-contracts:check PASS for fabric-os",
      "verifyCommand": "pnpm fabric:ops-contracts:check",
      "required": true
    }
  ]
}
```

## UAT

```canon-json uat
{
  "$schema": "gtcx://canon-os/product-canon-uat/v1",
  "bundleId": "FEAT-FABRIC-OPS-ASSURANCE",
  "version": "0.1.0",
  "scenarios": [
    {
      "id": "UAT-FOA-001",
      "title": "Fleet ops contract verifier green",
      "preconditions": ["fabric-os checkout"],
      "steps": ["Run pnpm fabric:ops-contracts:check"],
      "expected": "Exit 0 with PASS for fabric-os",
      "verifyCommand": "pnpm fabric:ops-contracts:check",
      "expectedExitCode": 0
    }
  ]
}
```
