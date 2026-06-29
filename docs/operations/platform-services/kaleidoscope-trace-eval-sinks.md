---
title: kaleidoscope trace and eval sinks
status: draft
date: 2026-06-29
owner: fabric-os
document_type: operations-spec
tier: operating
tags: ['operations', 'aiops', 'kaleidoscope-ai', 'signal', 'traces', 'evals']
review_cycle: weekly
---

# kaleidoscope trace and eval sinks

## Purpose

Kaleidoscope Phase 3 needs a Fabric-owned runtime substrate for traces and eval sinks.

Phase 2 can prove internal draft readiness from generated witnesses. SIGNAL L3 requires stronger operational evidence: trace, policy, approval, eval, rollback, and learning-loop records. Fabric owns the deployable sink pattern that makes those records durable and replayable.

## Scope

This spec defines the runtime contract for:

- agent and tool traces
- retrieval traces
- evaluator results
- approval boundary events
- rollback and incident hooks
- learning-loop updates

It does not define the full Kaleidoscope product API. That remains in `ecosystem-os`. It does not define SIGNAL scoring doctrine. That remains in `canon-os`. It does not define witness schema calibration. That remains in `baseline-os`.

## Sink model

The sink is append-first and evidence-first:

```text
kaleidoscope resource call
  -> trace event
  -> retrieval evidence event
  -> evaluator event
  -> approval boundary event
  -> optional action draft event
  -> witness link
  -> learning-loop candidate
```

Each event should be replayable from source witness paths and request metadata. The sink should never become a hidden source of truth for claims; it records how a claim was produced, evaluated, approved, rejected, or rolled back.

## Event classes

| Event class          | Purpose                                                                                            | Required for SIGNAL L3       |
| -------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------- |
| `agent_trace`        | Records orchestrator, specialist agent, tool, and handoff path.                                    | yes                          |
| `retrieval_trace`    | Records graph, RAG, lexical, and structured witness retrieval paths.                               | yes                          |
| `eval_result`        | Records citation, freshness, confidence, unsupported-claim, scope, and approval evaluator results. | yes                          |
| `approval_boundary`  | Records when a request crosses read, draft, write, or external boundary.                           | yes                          |
| `action_draft`       | Records draft action owner, validation command, release gate, and approval state.                  | yes for execution flows      |
| `rollback_hook`      | Records rollback plan or blocked rollback gap for state-changing flows.                            | yes for write/external flows |
| `learning_candidate` | Records accepted evaluator feedback or incident finding for future calibration.                    | yes                          |

## Minimum event envelope

Every sink event should include:

| Field         | Requirement                                                 |
| ------------- | ----------------------------------------------------------- |
| `schema`      | `gtcx://fabric-os/kaleidoscope-ai/trace-eval-sink/v1`.      |
| `eventId`     | Stable event id.                                            |
| `eventClass`  | One of the event classes above.                             |
| `generatedAt` | Event timestamp.                                            |
| `repo`        | Repo where the event is produced or observed.               |
| `resource`    | Kaleidoscope resource, if applicable.                       |
| `sessionId`   | Session or request correlation id.                          |
| `actor`       | Human, agent, runner, or service identity.                  |
| `inputRefs`   | Source witnesses, docs, graph nodes, or request refs.       |
| `outputRefs`  | Produced witness, report, action, or approval request refs. |
| `policy`      | Policy and approval boundary applied.                       |
| `evals`       | Evaluator ids, pass/fail state, and scores.                 |
| `risk`        | Failure mode, impact, and rollback requirement.             |
| `retention`   | Retention class and privacy handling.                       |

## Fabric responsibilities

Fabric owns:

- sink deployment posture
- runtime observability
- trace durability
- eval event storage
- rollback hook conventions
- retention class and access control
- environment promotion gates

Fabric does not approve external use. It records the approval boundary and stores the approval record link when one exists.

## Driver repo handoff

| Repo           | Handoff                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| `ecosystem-os` | Emits resource calls, response envelopes, witness links, and draft action metadata.          |
| `baseline-os`  | Publishes schema contracts for response envelopes and witness formats.                       |
| `bridge-os`    | Runs connectors and fleet orchestration that forward events into the sink.                   |
| `canon-os`     | Defines approval doctrine, SIGNAL criteria, and claim classes used by the sink policy field. |
| `agile-os`     | Receives action drafts and records approval/task lifecycle handoff.                          |
| `fabric-os`    | Operates the sink, runtime policy, observability, and rollback hooks.                        |

## Phase 3 MVP

1. Publish `pm/spec/kaleidoscope-ai/trace-eval-sink.schema.json`.
2. Add a local sink writer that can emit JSONL events for development use.
3. Wire read-only Kaleidoscope resources to emit `agent_trace`, `retrieval_trace`, and `eval_result` events.
4. Wire draft-only resources to emit `approval_boundary` and `action_draft` events.
5. Add release-gate checks that fail SIGNAL L3 claims when required event classes are missing.
6. Promote the sink to a managed runtime only after local replay passes.

## Acceptance gates

- Events are append-only and have stable ids.
- Every event links to at least one input reference or explicit no-input reason.
- Every synthesized answer has a retrieval trace and evaluator event.
- Every action-capable response has an approval boundary event.
- Write or external flows include rollback hook state.
- Learning-loop updates are candidates until reviewed and accepted.
- Retention and privacy class are explicit before production deployment.

## Open decisions

| Decision          | Default                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| Development sink  | JSONL under generated local evidence until runtime storage is approved.          |
| Production sink   | Fabric-managed trace store, selected after replay and retention needs are clear. |
| Event id format   | Deterministic hash of session id, event class, resource, and input refs.         |
| Retention classes | `internal`, `sensitive`, `external-approved`, `delete-required`.                 |
| External export   | Disabled until explicit artifact and audience approval exists.                   |
