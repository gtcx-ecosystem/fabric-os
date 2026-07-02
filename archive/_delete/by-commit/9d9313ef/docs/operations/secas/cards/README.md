# SecOps per-repo security cards

> **Ops lane:** SecOps · **Functional product:** SECaaS · **Registry:** [ops-programs.md](../../core-ops/batch-a/ops-programs.md)

Per-repo stack security action cards for SecOps operators.

| Card                                        | Repo / lane       | laneId   | Focus                                         |
| ------------------------------------------- | ----------------- | -------- | --------------------------------------------- |
| [compliance-os](./compliance-os.md)         | compliance-os     | L3       | IRSA, GHCR pull, staging SA                   |
| [markets-os](./markets-os.md)               | markets-os        | L4b      | WAF authority paths, ingress hardening        |
| [protocols-t0](./protocols-t0.md)           | protocols (T0)    | T0       | TradePass API pen-test boundary               |
| [gtcx-intelligence](./gtcx-intelligence.md) | gtcx-intelligence | L2       | Staging secrets, cost-router security surface |
| [terminal-os](./terminal-os.md)             | terminal-os       | L4a      | Staging EKS secrets, ALB/WAF, pen-test scope  |
| [fabric-os](./fabric-os.md)                 | fabric-os self    | platform | CI/CD, SLSA, supply-chain, static gates       |
| [bridge-os](./bridge-os.md)                 | bridge-os witness | coord    | P42 protocol, fleet risk/threat witness       |

Program: `INIT-GTCX-INFRA-SECAS` · Phase **SECAS-S4**.
