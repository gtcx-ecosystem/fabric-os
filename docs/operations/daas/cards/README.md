# DevOps & InfraOps per-repo cards

> **Ops lanes:** DevOps (delivery) + InfraOps (substrate) · **Functional product:** DaaS · **Registry:** [ops-programs.md](../../ops-programs.md)

Per-repo action cards for staging fleet operators.

| Card                                          | Repo / bundle  | laneId | deployProduct  |
| --------------------------------------------- | -------------- | ------ | -------------- |
| [compliance-os](./compliance-os.md)           | compliance-os  | L3     | product-hosted |
| [markets-os](./markets-os.md)                 | markets-os     | L4b    | GTCX Cloud     |
| [terminal-os](./terminal-os.md)               | terminal-os    | L2     | product-hosted |
| [gtcx-sovereign-l4a](./gtcx-sovereign-l4a.md) | GTCX Sovereign | L4a    | GTCX Sovereign |

**ADR-007 bundles:** Sovereign (L4a) and Cloud (L4b) deploy via gtcx-os platform — fabric hosts ingress, secrets, WAF, and pen-test boundaries per lane.

Program: `INIT-GTCX-INFRA-DAAS` · Phase **DAAS-S2**.
