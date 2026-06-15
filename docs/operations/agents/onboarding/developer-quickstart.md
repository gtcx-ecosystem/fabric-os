---
title: 'Developer Quickstart — gtcx-infrastructure'
status: current
date: 2026-05-27
owner: frontier-infra-engineer
tier: critical
tags: [['security', 'compliance', 'architecture', 'infrastructure', 'api']]
review_cycle: quarterly
document_type: onboarding
role: frontier-infra-engineer
agent_id: agent://gtcx-infrastructure/2026-05-27/session-backfill
trust_score: 60
autonomy_level: permissioned
---

> [!WARNING]
> **DEPRECATED — see [orientation.md](./orientation.md).**
> This document overlaps with the canonical onboarding path and is kept
> only so existing inbound links don't 404. New agents should start at
> orientation.md. Content here may drift; trust orientation.md when in doubt.

# Developer Quickstart — gtcx-infrastructure

Get local infrastructure running and understand the repo in under 10 minutes.

---

## Fastest Path: Start Local Services

```bash
## Clone
git clone https://github.com/gtcx-ecosystem/gtcx-infrastructure
cd gtcx-infrastructure

## Install Node dependencies
pnpm install

## Start all local infrastructure services
docker compose -f 04-deploy/docker/docker-compose.infra.yml up -d

## Confirm everything is up
docker compose -f 04-deploy/docker/docker-compose.infra.yml ps
```

That gives you two PostgreSQL instances, Redis, Prometheus, Grafana, Jaeger, and Loki — the full local observability and data stack.

---

## What This Repo Manages

`gtcx-infrastructure` owns all deployment, IaC, and operational tooling for the GTCX ecosystem. It contains no application logic. It orchestrates, deploys, and operates services from other repos.

```
04-deploy/
  docker/          Docker images + Compose configs for local and test environments
  kubernetes/      K8s manifests organized with Kustomize (base + per-env overlays)
  terraform/       AWS IaC modules — VPC, dual RDS (operational + audit)
  migrations/      Rails-based database migration stack
  security/        Security policies, access control, incident response, scanner
  03-platform/scripts/         deploy.sh, migrate.sh, seed.sh, setup.sh
  edge-proxy/      Edge proxy configuration
```

---

## First Workflow: Run a Terraform Plan

Before changing any live infrastructure, always run a plan:

```bash
## Navigate to the environment you want to inspect
cd 04-deploy/terraform/environments/{env}

## Initialize (first time only)
terraform init

## View what would change — never apply without reviewing this
terraform plan
```

No automated apply runs without human review. See [ci-cd.md](../../operations/ci-cd/ci-cd.md) for the full approval gate.

---

## First Workflow: Apply a Kubernetes Change

```bash
## Lint manifests
pnpm lint

## Preview what would change (dry run)
kubectl diff -k 04-deploy/kubernetes/overlays/development

## Apply to development namespace
kubectl apply -k 04-deploy/kubernetes/overlays/development

## Staging and production require human approval — use deploy.sh
./04-deploy/03-platform/scripts/deploy.sh staging
./04-deploy/03-platform/scripts/deploy.sh production --approval-ticket=GTCX-123
```

---

## First Workflow: Run Database Migrations

```bash
## Development — autonomous, no approval required
./04-deploy/03-platform/scripts/migrate.sh development

## Staging — always dry-run first
./04-deploy/03-platform/scripts/migrate.sh staging --dry-run
./04-deploy/03-platform/scripts/migrate.sh staging

## Production — requires explicit approval
./04-deploy/03-platform/scripts/migrate.sh production --dry-run
## After review: ./04-deploy/03-platform/scripts/migrate.sh production
```

---

## Architecture Overview

- **Docker** — local dev and test environments; two base images (`Dockerfile.base` for Ruby/Rust, `Dockerfile.node` for Node.js services)
- **Kubernetes (Kustomize)** — three overlays: `development`, `staging`, `production`; five services: `api`, `crypto`, `tradepass`, `geotag`, `gci`
- **Terraform** — two modules: `vpc/` (network isolation) and `database/` (dual RDS — operational + audit); per-environment directories under `environments/`
- **Migrations** — Rails-based; config per environment in `migrations/config/`; never touch the audit DB
- **Security** — policies in `security/policies/`; scanner at `03-platform/tools/scripts/security-status.js`; audit reports in `security/reports/`

Two databases are a hard constraint. They are never merged:

| Instance       | Port | DB Name            | User         | Purpose                  |
| -------------- | ---- | ------------------ | ------------ | ------------------------ |
| postgres       | 5432 | `gtcx_development` | `gtcx`       | Application read/write   |
| postgres-audit | 5433 | `gtcx_audit`       | `gtcx_audit` | Append-only audit events |

---

## Local Service URLs

| Service    | URL                    |
| ---------- | ---------------------- |
| Grafana    | http://localhost:3030  |
| Prometheus | http://localhost:9090  |
| Jaeger UI  | http://localhost:16686 |
| Loki       | http://localhost:3100  |

---

## Essential References

- [service-overview.md](service-overview.md) — what this repo manages and why
- [developer-setup.md](developer-setup.md) — full prerequisites and environment setup
- [system-overview.md](../../architecture/system-overview.md) — complete infrastructure architecture
- [deploy runbook](../../operations/runbooks/deploy.md) — step-by-step deployment
- [migrate runbook](../../operations/runbooks/migrate.md) — migration discipline
- [safety-rules.md](../workflows/agent-safety-rules.md) — what requires human approval

---

## Need Help?

- GitHub Issues: https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues
- Security contact: security@gtcx.trade
- Infrastructure on-call: see `01-docs/04-ops/runbooks/incident-response.md`
