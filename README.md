# Fabric OS

**Lane:** **I — Infra** (cloud control plane for the GTCX trade ecosystem)

Service fabric execution layer: AWS/EKS/Terraform, **DevOps · InfraOps · SecOps** (DaaS/SECaaS functional products), staging/prod deploy, and fleet infra assurance. **Trade infrastructure core (C)** lives in sibling **`gtcx-os`** — fabric **runs** it; fabric does not define trade protocols or platform desks.

| Ops programs | [`docs/operations/ops-programs.md`](./docs/operations/ops-programs.md) |
| **CORE** | [`docs/operations/core.md`](./docs/operations/core.md) — Centralized Ops Runtime Engine |

| Resource               | Path                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent entry            | [`AGENTS.md`](./AGENTS.md)                                                                                                                             |
| Lane spec              | [`docs/specs/ecosystem/trade-ecosystem-lanes-spec.md`](./docs/specs/ecosystem/trade-ecosystem-lanes-spec.md)                                           |
| Deploy matrix          | [`docs/operations/coordination/infra-per-repo-action-matrix-2026-06-05.md`](./docs/operations/coordination/infra-per-repo-action-matrix-2026-06-05.md) |
| P34 shadow (read-only) | [`gtcx-os/platform/infrastructure/`](https://gtcx.trade/ecosystem/03-platform/infrastructure/)                                                         |

**Edit SoR:** this repo (`fabric-os`). P34 monorepo shadow is browse/cache only — see [repo-redirects](https://gtcx.trade/ecosystem/01-docs/operations/ecosystem/repo-redirects).

## Quick Start

```bash
git clone https://github.com/gtcx-ecosystem/fabric-os.git && cd fabric-os
pnpm install
pnpm operations:check
```

See [`docs/README.md`](./docs/README.md) for the documentation index and [`AGENTS.md`](./AGENTS.md) for agent session entry.

## Governance

| Document        | Path                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| Contributing    | [CONTRIBUTING.md](./01-docs/operations/repo/CONTRIBUTING.md)                   |
| Code of conduct | [CODE_OF_CONDUCT.md](./01-docs/operations/repo/CODE_OF_CONDUCT.md)             |
| Security        | [SECURITY.md](./01-docs/operations/repo/SECURITY.md)                           |
| Repo hygiene    | [repo-hygiene-protocol.md](./01-docs/operations/repo/repo-hygiene-protocol.md) |
| Changelog       | [CHANGELOG.md](./CHANGELOG.md)                                                 |
| License         | [LICENSE](./LICENSE)                                                           |

## Agents

| Resource    | Path                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Agent entry | [AGENTS.md](./AGENTS.md)                                                              |
| Audit start | [05-audit/AGENT-START.md](./05-audit/AGENT-START.md)                                  |
| Layout v3   | [ecosystem-repo-layout-v3.md](./01-docs/04-ops/workspace/ecosystem-repo-layout-v3.md) |
