---
title: Layout v5 pointer — fabric-os
status: current
date: 2026-06-22
owner: fabric-os
document_type: runbook
tier: operating
review_cycle: on-change
tags: [fabric-os, operations]
---

# Layout v5 — local SoR pointer

| Artifact         | Path                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Machine contract | [`../../../../bridge-os/config/ecosystem-layout-contract.json`](../../../../bridge-os/config/ecosystem-layout-contract.json) |
| Runtime pointer  | [`../../../config/layout-contract.json`](../../../config/layout-contract.json)                                               |
| Ops manifest     | [`../../../config/ops.manifest.json`](../../../config/ops.manifest.json)                                                     |
| Root allowlist   | [`../repo/root-allowlist.json`](../repo/root-allowlist.json)                                                                 |

## Local hub map (fabric-os)

| v5 hub        | Physical path                 | Notes                                  |
| ------------- | ----------------------------- | -------------------------------------- |
| `docs/`       | `docs/`                       | Product + operations docs              |
| `operations/` | `operations/`                 | P29 ops domains                        |
| `machine/`    | `machine/`                    | PM / backlog / CI SoR                  |
| `ops/`        | `operations/`                 | PHASE-TAXONOMY back-compat shim        |
| `pm/`         | `machine/`                    | PHASE-TAXONOMY back-compat shim        |
| `ops/pm/`     | `operations/pm/` → `machine/` | P35 manifest path                      |
| `agentic/`    | `agentic/`                    | Thin bridge — runtime SoR at `agents/` |

See also [`ecosystem-repo-layout.md`](./ecosystem-repo-layout.md) for operator narrative.
