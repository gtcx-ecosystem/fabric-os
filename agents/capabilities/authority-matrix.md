---
title: 'authority-matrix'
status: current
date: 2026-06-22
owner: fabric-os
document_type: onboarding
tier: critical
tags: ['documentation', 'agents']
review_cycle: on-change
---

# Authority matrix — fabric-os

| Class | Meaning                     | Examples                                               |
| ----- | --------------------------- | ------------------------------------------------------ |
| **R** | Routine autonomous          | lint, test, docs gates, micro-commit, staging scripts  |
| **A** | Agent custody with artifact | terraform apply after XR-401, trust attestation writes |
| **S** | Sovereign human             | production secrets, legal sign-off, operator **stop**  |

Spec: [Protocol 28](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/protocols/28-agent-authority-classification/protocol.md)
