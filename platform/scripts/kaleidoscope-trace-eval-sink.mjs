#!/usr/bin/env node
/**
 * Kaleidoscope trace/eval sink local harness.
 *
 * Usage:
 *   node platform/scripts/kaleidoscope-trace-eval-sink.mjs
 *   node platform/scripts/kaleidoscope-trace-eval-sink.mjs --write
 *   node platform/scripts/kaleidoscope-trace-eval-sink.mjs --json
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const WITNESS_REL = 'audit/evidence/kaleidoscope-trace-eval-sink-latest.json';
const EVENTS_REL = 'audit/evidence/kaleidoscope-trace-eval-sink-events.jsonl';
const WITNESS = join(ROOT, WITNESS_REL);
const EVENTS = join(ROOT, EVENTS_REL);
const SCHEMA_REL = 'machine/spec/kaleidoscope-ai/trace-eval-sink.schema.json';
const RUNBOOK_REL = 'docs/operations/platform-services/kaleidoscope-trace-eval-sinks.md';

const REQUIRED_EVENT_CLASSES = [
  'agent_trace',
  'retrieval_trace',
  'eval_result',
  'approval_boundary',
  'action_draft',
  'rollback_hook',
  'learning_candidate',
];

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function idFor(parts) {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);
}

function ref(type, path, reason) {
  return { type, path, reason };
}

function event(eventClass, overrides = {}) {
  const sessionId = 'kaleidoscope-phase-3-local-sink';
  const resource = overrides.resource ?? 'decision-room';
  const inputRefs = overrides.inputRefs ?? [
    ref('schema', SCHEMA_REL, 'event schema contract'),
    ref('doc', RUNBOOK_REL, 'Fabric trace/eval sink runbook'),
  ];
  const inputRefKey = inputRefs
    .map(({ type, path, reason }) => `${type}:${path}:${reason}`)
    .sort()
    .join(',');
  const eventId = `ktes-${idFor([sessionId, eventClass, resource, inputRefKey])}`;
  return {
    schema: 'gtcx://fabric-os/kaleidoscope-ai/trace-eval-sink/v1',
    eventId,
    eventClass,
    generatedAt: '2026-06-29T00:00:00.000Z',
    repo: 'fabric-os',
    resource,
    sessionId,
    actor: {
      type: 'runner',
      id: 'platform/scripts/kaleidoscope-trace-eval-sink.mjs',
    },
    inputRefs,
    outputRefs: overrides.outputRefs ?? [],
    policy: {
      boundary: overrides.boundary ?? 'read',
      approvalStatus: overrides.approvalStatus ?? 'not_required',
      policyRefs: [ref('doc', RUNBOOK_REL, 'approval boundary policy')],
      approvalRecord: null,
    },
    evals: overrides.evals ?? [
      {
        id: 'event-envelope-present',
        passed: true,
        score: 1,
        details: 'event contains required local sink envelope fields',
      },
    ],
    risk: {
      severity: overrides.severity ?? 'none',
      failureMode: overrides.failureMode ?? 'local development sink event only',
      rollbackRequired: overrides.rollbackRequired ?? false,
      rollbackRef: overrides.rollbackRef ?? null,
    },
    retention: {
      class: 'internal',
      privacy: 'none',
      ttlDays: null,
    },
    payload: overrides.payload ?? {},
  };
}

function buildEvents() {
  return [
    event('agent_trace', {
      payload: {
        route: ['orchestrator', 'decision-room-resource', 'evaluator'],
      },
    }),
    event('retrieval_trace', {
      payload: {
        retrievalModes: ['graph', 'structured-witness', 'lexical'],
      },
    }),
    event('eval_result', {
      evals: [
        { id: 'citations-present', passed: true, score: 1 },
        { id: 'freshness-present', passed: true, score: 1 },
        { id: 'approval-boundary-present', passed: true, score: 1 },
      ],
    }),
    event('approval_boundary', {
      resource: 'actions',
      boundary: 'draft',
      approvalStatus: 'draft_pending_approval',
      payload: {
        blockedActions: ['repo-write', 'ticket-create', 'external-send', 'deployment'],
      },
    }),
    event('action_draft', {
      resource: 'actions',
      boundary: 'draft',
      approvalStatus: 'draft_pending_approval',
      outputRefs: [ref('action', 'draft:kaleidoscope-phase-3-local-sink', 'sample draft action')],
      payload: {
        ownerRepo: 'fabric-os',
        validation: 'pnpm kaleidoscope:trace-eval-sink:check',
      },
    }),
    event('rollback_hook', {
      resource: 'actions',
      boundary: 'write',
      approvalStatus: 'blocked_until_explicit_approval',
      severity: 'medium',
      failureMode: 'write or external action requested without rollback hook',
      rollbackRequired: true,
      rollbackRef: RUNBOOK_REL,
    }),
    event('learning_candidate', {
      payload: {
        status: 'candidate_until_reviewed',
        source: 'local sink harness',
      },
    }),
  ];
}

function validateEvent(eventRecord) {
  const errors = [];
  if (eventRecord.schema !== 'gtcx://fabric-os/kaleidoscope-ai/trace-eval-sink/v1') {
    errors.push(`${eventRecord.eventId}: invalid schema`);
  }
  for (const field of ['eventId', 'eventClass', 'generatedAt', 'repo', 'sessionId']) {
    if (!eventRecord[field]) errors.push(`${eventRecord.eventId ?? 'event'}: missing ${field}`);
  }
  if (!REQUIRED_EVENT_CLASSES.includes(eventRecord.eventClass)) {
    errors.push(`${eventRecord.eventId}: unsupported eventClass ${eventRecord.eventClass}`);
  }
  if (!eventRecord.actor?.type || !eventRecord.actor?.id) {
    errors.push(`${eventRecord.eventId}: missing actor`);
  }
  if ((eventRecord.inputRefs ?? []).length === 0 && !eventRecord.noInputReason) {
    errors.push(`${eventRecord.eventId}: inputRefs or noInputReason required`);
  }
  if (!eventRecord.policy?.boundary || !eventRecord.policy?.approvalStatus) {
    errors.push(`${eventRecord.eventId}: missing policy boundary/status`);
  }
  if (!eventRecord.risk?.failureMode || typeof eventRecord.risk?.rollbackRequired !== 'boolean') {
    errors.push(`${eventRecord.eventId}: missing risk failureMode/rollbackRequired`);
  }
  if (!eventRecord.retention?.class || !eventRecord.retention?.privacy) {
    errors.push(`${eventRecord.eventId}: missing retention class/privacy`);
  }
  return errors;
}

function buildWitness() {
  const schema = readJson(SCHEMA_REL);
  const events = buildEvents();
  const eventClasses = new Set(events.map((item) => item.eventClass));
  const missingEventClasses = REQUIRED_EVENT_CLASSES.filter((item) => !eventClasses.has(item));
  const errors = [
    ...(existsSync(join(ROOT, SCHEMA_REL)) ? [] : [`missing ${SCHEMA_REL}`]),
    ...(existsSync(join(ROOT, RUNBOOK_REL)) ? [] : [`missing ${RUNBOOK_REL}`]),
    ...events.flatMap(validateEvent),
    ...missingEventClasses.map((item) => `missing event class ${item}`),
  ];
  const writeBoundaryBlocked = events.some(
    (item) =>
      item.policy.boundary === 'write' &&
      item.policy.approvalStatus === 'blocked_until_explicit_approval' &&
      item.risk.rollbackRequired === true,
  );
  if (!writeBoundaryBlocked) errors.push('write boundary rollback hook is not blocked');

  return {
    schema: 'gtcx://fabric-os/kaleidoscope-ai/trace-eval-sink-harness/v1',
    generatedAt: new Date().toISOString(),
    repo: 'fabric-os',
    ok: errors.length === 0,
    summary: {
      eventCount: events.length,
      eventClasses: [...eventClasses].sort(),
      requiredEventClasses: REQUIRED_EVENT_CLASSES,
      missingEventClasses,
      schemaId: schema.$id,
      localDevelopmentSink: EVENTS_REL,
      writeBoundaryBlocked,
    },
    errors,
    sources: {
      schema: SCHEMA_REL,
      runbook: RUNBOOK_REL,
    },
    outputs: {
      witness: WITNESS_REL,
      events: EVENTS_REL,
    },
    events,
  };
}

function main() {
  const witness = buildWitness();
  if (WRITE) {
    mkdirSync(dirname(WITNESS), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
    writeFileSync(EVENTS, `${witness.events.map((item) => JSON.stringify(item)).join('\n')}\n`);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log('=== kaleidoscope:trace-eval-sink:check ===');
    console.log(`events: ${witness.summary.eventCount}`);
    console.log(`classes: ${witness.summary.eventClasses.join(', ')}`);
    console.log(`write-boundary-blocked: ${witness.summary.writeBoundaryBlocked}`);
    console.log(`ok: ${witness.ok}`);
    if (WRITE) {
      console.log(`witness: ${WITNESS_REL}`);
      console.log(`events: ${EVENTS_REL}`);
    }
    for (const error of witness.errors) console.log(`error: ${error}`);
  }
  process.exit(witness.ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
