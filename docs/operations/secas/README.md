# SecOps (SECaaS functional product) — operator index

> **Ops lane:** **SecOps** · **Functional product:** SECaaS · **Initiative:** `INIT-GTCX-INFRA-SECAS` · **Protocol:** P42  
> **Registry:** [ops-programs.md](../ops-programs.md)  
> **Primary owner:** fabric-os (co-primary with DevOps/InfraOps — not bridge-os program office)

| Artifact             | Path                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| Ops entry            | [security-as-a-service.md](../security-as-a-service.md)                                |
| All Ops lanes        | [ops-programs.md](../ops-programs.md)                                                  |
| Roadmap              | `pm/secas-roadmap.json`                                                                |
| Stories              | `pm/secas-stories.json`                                                                |
| Operational friction | `pm/security-friction-register.json`                                                   |
| Class S sovereign    | `pm/sovereign-approval-register.json`                                                  |
| Execution roadmap    | `audit/product-management/secas-execution-roadmap.md`                                  |
| S4 program           | [SECAS-S4-security-engineering-program.md](./SECAS-S4-security-engineering-program.md) |
| Task inbox           | `pm/_tasks` — `INIT-GTCX-INFRA-SECAS`                                                  |
| Fleet harness        | `pnpm --dir ../bridge-os ecosystem:secas:check`                                        |

```bash
pnpm secas:friction:check
pnpm secas:approval:check
pnpm secas:cards:check
pnpm generate:secas-roadmap
```
