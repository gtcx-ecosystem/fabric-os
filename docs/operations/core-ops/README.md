---
title: 'Core Ops'
status: current
date: 2026-06-18
owner: fabric-os
document_type: overview
tier: operating
tags: ['operations', 'core-ops', 'fabric']
review_cycle: on-change
---

# Core Ops

Core Ops is the Fabric OS operating layer for deployment, security, fleet
coordination, cost, payments, communications, and assurance evidence.

## Lanes

| Lane         | Fabric role                                         |
| ------------ | --------------------------------------------------- |
| InfraOps     | Cloud, Kubernetes, Terraform, and runtime substrate |
| DevOps       | Deployment choreography and fleet health evidence   |
| SecOps       | Shared security controls and assurance witnesses    |
| EcosystemOps | Cross-repo operational network checks               |
| FinOps       | Cost policy consumption and cost witnesses          |
| PayOps       | Shared payment provider substrate                   |
| CommOps      | Shared communication substrate                      |
| AIOps        | Operational AI evidence and routing substrate       |

## Gates

```bash
pnpm fabric:ops-lanes-11pr:check
pnpm fabric:ops:check
```
