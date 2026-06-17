---
title: 'fabric-os — Documentation Index'
status: current
date: 2026-06-17
owner: fabric-os
tier: standard
tags: ['docs', 'ia', 'layout-v3']
review_cycle: quarterly
document_type: index
---

# fabric-os — Documentation Index

**Path contract:** [`config/sor-map.json`](../config/sor-map.json) · machine table: [`INDEX.md`](./INDEX.md)

## Start here

| Surface                    | Path                                                                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docs IA map                | [`INDEX.md`](./INDEX.md)                                                                                                                                                                            |
| Agent work selection       | [`operations/agent-spine/agent-work-selection.md`](./operations/agent-spine/agent-work-selection.md)                                                                                                |
| Execution roadmap (DaaS)   | [`../audit/product-management/execution-roadmap.md`](../../audit/archive/legacy-docs-audit/archive/legacy-docs-audit/archive/legacy-docs-audit/product-management/execution-roadmap.md)             |
| Execution roadmap (SECaaS) | [`../audit/product-management/secas-execution-roadmap.md`](../../audit/archive/legacy-docs-audit/archive/legacy-docs-audit/archive/legacy-docs-audit/product-management/secas-execution-roadmap.md) |
| Auto-dev state             | [`../audit/product-management/auto-dev-state.md`](../../audit/archive/legacy-docs-audit/archive/legacy-docs-audit/archive/legacy-docs-audit/product-management/auto-dev-state.md)                   |
| Audit entry                | [`../audit/AGENT-START.md`](../../audit/archive/legacy-docs-audit/archive/legacy-docs-audit/archive/legacy-docs-audit/AGENT-START.md)                                                               |
| Agents (canonical)         | [`operations/agents/README.md`](./operations/agents/README.md)                                                                                                                                      |
| Runbooks                   | [`operations/runbooks/`](./operations/runbooks/)                                                                                                                                                    |
| Architecture narratives    | [`architecture/narratives/`](./architecture/narratives/)                                                                                                                                            |
| SECaaS operations          | [`operations/secas/`](./operations/secas/)                                                                                                                                                          |
| GTM ops domain             | [`../ops/gtm/README.md`](../ops/gtm/README.md)                                                                                                                                                      |

## Layout v3 hubs

| Hub        | Path          | Role                                    |
| ---------- | ------------- | --------------------------------------- |
| Archive    | `archive/`    | Retired artifacts                       |
| Docs       | `docs/`       | Internal documentation (this tree)      |
| Ops        | `ops/`        | PM, coordination, attestation domains   |
| Platform   | `platform/`   | Workspace packages + agent scripts      |
| Deploy     | `deploy/`     | Terraform, Kubernetes, operator scripts |
| Audit      | `audit/`      | Audit entry + evidence hub              |
| Workstream | `workstream/` | Active workstream coordination          |

## GTM / regulatory (archive)

Legacy GTM narrative packs moved under `archive/legacy-docs-roadmap/gtm/` during P35 IA uplift. Use [`../ops/gtm/README.md`](../ops/gtm/README.md) for current GTM ops domain pointers.

## Doc-site

- **Published source:** [`gitbook/docs-site/`](./gitbook/docs-site/README.md)
- **Build pipeline:** [`../platform/tools/docs-site/`](../platform/tools/docs-site/README.md)
