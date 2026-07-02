---
title: 'Docs root — folder provisioning spec'
status: current
date: 2026-06-15
owner: fabric-os
document_type: folder-spec
tier: critical
tags: ['documentation', 'agents', 'provisioning']
review_cycle: on-change
goals: 'Agents provision docs/ without random folders — infra-platform profile'
---

# `docs/` — root provisioning (fabric-os)

> **Profile:** `infra-platform` · **Registry:** `canon-os/pm/spec/docs-folder-provisioning.json`

## Purpose

Repo-scoped documentation for **fabric-os**. Read `INDEX.md` before creating paths.

## Top-level folders (current)

| Folder          | Purpose                                             | `document_type` |
| --------------- | --------------------------------------------------- | --------------- |
| `agents/`       | Agent provisioning, personas, startup paths         | per profile     |
| `agile/`        | Agile pointers (prefer ops/pm for execution)        | per profile     |
| `api/`          | API contract pointers and reference                 | per profile     |
| `architecture/` | System design, ADRs, integration maps               | per profile     |
| `engineering/`  | Tooling, CLI, workflows, build narratives           | per profile     |
| `gitbook/`      | GitBook publish source (SUMMARY.md + chapters)      | per profile     |
| `governance/`   | Repo-scoped governance pointers                     | per profile     |
| `operations/`   | Runbooks and ops narrative (P29 domains under ops/) | per profile     |
| `overview/`     | What this repo is — strategic truth                 | per profile     |
| `reference/`    | Templates, guides, glossary, examples               | per profile     |
| `roadmap/`      | Strategy and execution pointers                     | per profile     |
| `specs/`        | Product and surface specifications                  | per profile     |

## Required root files

`README.md` · `INDEX.md` · `sor.json` · `conventions.md` · `CHANGELOG.md` · `FOLDER-SPEC.md`

## Forbidden

- New top-level folders without `CHANGELOG.md` entry + profile check
- P29 ops domains under `docs/` (`compliance/`, `gtm/`, `security/`) — use `ops/`
- Version path tokens (`-v2`, `v3/`) — Protocol 47
- Numbered segments (`01-agents/`) — relocate to canonical names

## Agent rules

1. Read `docs/INDEX.md` and this file first
2. Set `document_type` in frontmatter per `canon-os/pm/spec/docs-document-types.json`
3. Add `README.md` with every new directory
4. Log structural changes in `CHANGELOG.md`
