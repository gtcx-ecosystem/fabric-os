# Safety Rules — gtcx-infrastructure

What agents and contributors may do autonomously vs. what requires explicit human authorization.

Governed by the Baseline Protocol (`ai-1-baseline`) and enforced through `1-agentic`. These rules apply to all AI-assisted work in this repo.

---

## Autonomous — No Approval Required

- Read any file in the repo
- Run any quality gate (`pnpm lint`, `pnpm typecheck`, `terraform validate`, `terraform fmt -check`, etc.)
- Write or update documentation in `_sop/`
- Propose ADRs — status must remain `Proposed`; human approval required before `Accepted`
- Commit completed work using conventional commit format — commit after each meaningful, self-contained unit of work; never accumulate multiple tasks into a single commit

---

## Requires Human Approval Before Proceeding

| Action                                                        | Reason                                |
| ------------------------------------------------------------- | ------------------------------------- |
| Any `terraform apply`                                         | Modifies live infrastructure          |
| Any `kubectl apply` to production namespaces                  | Modifies production workloads         |
| Any change to `infra/terraform/` IAM or state config          | Controls access to all environments   |
| Any change to K8s RBAC, network policies, or secret manifests | Security-sensitive                    |
| Any change to `infra/security/`                               | Security scanning and firewall policy |
| Any change to `infra/migrations/` that is destructive         | Irreversible data changes             |
| Any change to base Docker images                              | Supply chain and security impact      |
| Any change to `.github/workflows/`                            | CI/CD pipeline                        |
| Marking an ADR status `Accepted`                              | Architectural decision finalization   |
| Any destructive git operation                                 | Irreversible                          |

---

## Never — Hard Rules

These rules have no exceptions. There is no circumstance where these actions are permitted:

- Never skip CI gates — no `--no-verify`, no bypassing hooks
- Never push to `main` without explicit instruction
- Never force push
- Never commit secrets, credentials, API keys, or `.env` files — all secrets come from the vault
- Never remove or downgrade a security control
- Never `terraform apply` without reviewing `terraform plan` output first
- Never run destructive migrations without a verified rollback plan
- Never mark a release checklist item complete without running the actual gate
- Never mark an ADR `Accepted` without human approval

---

## Escalation

If uncertain whether an action requires approval: stop. State the action, the uncertainty, and the consequence of getting it wrong. Ask.

The cost of pausing is zero. The cost of an unauthorized infrastructure change can be catastrophic — affecting all running GTCX services.

---

## Reference

- [`_sop/1-agents/3-structure/coordination.md`](../3-structure/coordination.md) — decision matrix and coordination protocols
- [`_sop/1-agents/4-workflows/tasks/`](./tasks/) — task playbooks for common operations
- [`_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md`](../../2-docs/4-devops/7-release-mgmt/release-checklist.md) — release gate checklist
- `ai-1-baseline` — Baseline Protocol governing these rules
