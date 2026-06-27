---
title: 'operations/protocols'
status: current
date: 2026-06-16
owner: fabric-os
document_type: runbook
tier: critical
tags: ['documentation', 'operations']
review_cycle: on-change
---

# Fabric operations protocols

Fabric-os owns the shared deployment, infrastructure, SecOps, and CI/automation lanes for the fleet. It does not own the bridge-os vault SoR, baseline-os runtime primitives, canon-os protocol law, or product application behavior.

## Operating roles

| Role                    | Owner        | Responsibility                                                                                      |
| ----------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| DevOps/InfraOps owner   | fabric-os    | AWS, Kubernetes, Terraform, ESO, ingress, fleet health, staging substrate                           |
| SecOps owner            | fabric-os    | Shared controls, security friction tracking, vendor-assurance evidence, redacted security witnesses |
| CI/automation owner     | fabric-os    | GitHub Actions/org automation secret installation and rotation policy                               |
| Vault SoR owner         | bridge-os    | Shared provider credentials, agent vault commands, audited credential access                        |
| Runtime primitive owner | baseline-os  | `@baselineos/vault`, CLI/runtime primitives, session and evidence command surface                   |
| Product runtime owner   | Product repo | Product env consumption, local runtime, app behavior, owner-repo witnesses                          |
| Protocol authority      | canon-os     | Protocol 19, authority classes, credential contracts, redaction rules                               |

`gtcx-infrastructure` is a legacy alias for `fabric-os`. New routing should use `fabric-os` unless linking to immutable historical evidence.

## Authority boundaries

| Work                                                                | Authority | Executor                                 |
| ------------------------------------------------------------------- | --------- | ---------------------------------------- |
| Prepare IaC, ESO manifests, runbooks, and redacted checks           | R         | Agent                                    |
| Verify staging credential chain without exposing values             | R         | Agent                                    |
| Populate AWS Secrets Manager live values                            | A         | Authorized operator                      |
| Install or rotate GitHub repository/org secrets such as `NPM_TOKEN` | A         | Repo/org admin under fabric-os CI policy |
| Legal, regulator, vendor, or customer countersignature              | S         | Human sovereign authority                |

Class A/S gates must be reported as Approval needed. They do not freeze unrelated Class R fabric-os work when `blocksIR:false`.

## Vault and credential entry

Fabric consumes the bridge-os vault SoR for shared provider credentials and uses fabric-owned substrate manifests for staging projection.

```bash
pnpm --dir ../bridge-os agent:vault:verify
```

Runbook: `../bridge-os/docs/operators/vault-environments.md`.

## Local protocol documents

| Protocol                 | Path                                                         |
| ------------------------ | ------------------------------------------------------------ |
| Staging credential chain | `docs/operations/protocols/staging-credential-chain.md`      |
| DevOps as a Service      | `docs/operations/platform-services/devops-as-a-service.md`   |
| Security as a Service    | `docs/operations/platform-services/security-as-a-service.md` |
| Security policy          | `docs/operations/repo/security.md`                           |
