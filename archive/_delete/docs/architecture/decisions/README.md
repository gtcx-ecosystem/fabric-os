---
title: 'Decisions'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['architecture', 'infrastructure', 'database', 'network', 'mobile']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# Decisions

Architecture Decision Records (ADRs) capturing key design choices and their rationale.

## ADRs

| ADR                                                                  | Title                                               | Status   |
| -------------------------------------------------------------------- | --------------------------------------------------- | -------- |
| [ADR-001](./batch-a/ADR-001-monorepo-structure.md)                   | Monorepo Structure                                  | Accepted |
| [ADR-002](./batch-a/ADR-002-commodity-agnostic-design.md)            | Commodity-Agnostic Design                           | Accepted |
| [ADR-003](./batch-a/ADR-003-ai-native-architecture.md)               | AI-Native Architecture                              | Accepted |
| [ADR-004](./batch-a/ADR-004-offline-first-mobile.md)                 | Offline-First Mobile Architecture                   | Accepted |
| [ADR-005](./batch-a/ADR-005-jurisdiction-plugins.md)                 | Jurisdiction Plugin Architecture                    | Accepted |
| [ADR-006](./batch-a/ADR-006-package-boundaries.md)                   | Package Boundaries and Dependencies                 | Accepted |
| [ADR-007](./batch-a/ADR-007-kustomize-over-helm.md)                  | Use Kustomize over Helm for K8s manifest management | Accepted |
| [ADR-008](./batch-a/ADR-008-dual-database-architecture.md)           | Separate operational and audit databases            | Accepted |
| [ADR-009](./batch-a/ADR-009-error-taxonomy.md)                       | Structured Error Taxonomy                           | Accepted |
| [ADR-010](./batch-a/ADR-010-in-memory-stub-guards.md)                | In-Memory Stub Guards                               | Accepted |
| [ADR-011](./batch-a/ADR-011-connectivity-profiles.md)                | Connectivity Profiles                               | Accepted |
| [ADR-012](./batch-a/ADR-012-deprecate-gtcx-core12-gtcx-amis.md)      | Deprecate `gtcx-core12` and `gtcx-amis`             | Accepted |
| [ADR-013](./batch-a/ADR-013-mtls-service-mesh.md)                    | mTLS and Service Mesh Architecture                  | Accepted |
| [ADR-014](./batch-b/ADR-014-nats-jetstream-audit-transport.md)       | NATS JetStream as the Audit Record Transport        | Accepted |
| [ADR-015](./batch-b/ADR-015-per-tenant-jetstream-subject-routing.md) | Per-Tenant JetStream Subject Routing                | Accepted |
| [ADR-016](./batch-b/ADR-016-fail-closed-audit-signing.md)            | Fail-Closed Audit Signing in Production             | Accepted |
| [ADR-017](./batch-b/ADR-017-adaptive-policy-tuning.md)               | Adaptive Policy Tuning with Signed Transitions      | Accepted |
| [ADR-018](./batch-b/ADR-018-pen-test-contained-overlay.md)           | Pen-Test Contained-Blast-Radius Kubernetes Overlay  | Accepted |
| [ADR-019](./batch-b/ADR-019-workspace-boundary-discipline.md)        | Workspace Package Boundary Discipline               | Accepted |
| [ADR-020](./batch-b/ADR-020-per-package-coverage-thresholds.md)      | Per-Package Coverage Thresholds                     | Accepted |
| [ADR-021](./batch-b/ADR-021-npm-publish-discipline.md)               | npm Publish Discipline + Supply-Chain Roadmap       | Accepted |
| [ADR-022](./batch-b/ADR-022-pluggable-audit-query-store.md)          | Pluggable Audit-Query Store with Three Backends     | Accepted |

## Adding a New ADR

1. Use the next sequential ADR number.
2. Name file `ADR-NNN-short-title.md`.
3. Include status, context, decision, and consequences.
4. Update this README.
