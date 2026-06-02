/**
 * @fileoverview Audit Record Sink — pluggable durable emitter.
 *
 * The default sink writes signed audit records to stdout as NDJSON, which
 * is shipped via Promtail/Loki/CloudWatch and ends up in the WORM S3
 * bucket via the audit-flush sidecar.
 *
 * Optionally, AUDIT_SINK=nats enables direct publish to NATS JetStream
 * on the configured subject. This is the recommended sink for high
 * volume deployments because it gives at-least-once delivery and
 * decouples gateway pod lifetime from chain durability.
 *
 * Sinks fail-soft: a transient sink error never blocks the signing path
 * or the request; the in-memory chain remains the authoritative copy
 * until the next checkpoint.
 */

function sinkMode() { return (process.env.AUDIT_SINK || 'stdout').toLowerCase(); }
function natsSubject() { return process.env.AUDIT_NATS_SUBJECT || 'gtcx.audit.compliance-gateway'; }
function natsUrl() { return process.env.NATS_URL || 'nats://nats.gtcx.svc.cluster.local:4222'; }

let natsClient = null;
let natsConnectPromise = null;

/**
 * @typedef {{
 *   emit: (record: object) => void,
 *   close: () => Promise<void>,
 *   mode: string,
 * }} AuditSink
 */

function stdoutSink() {
  return {
    mode: 'stdout',
    emit(record) {
      console.log(JSON.stringify({ type: 'audit.signed', record }));
    },
    async close() {},
  };
}

async function connectNats() {
  if (natsClient) return natsClient;
  if (natsConnectPromise) return natsConnectPromise;
  natsConnectPromise = (async () => {
    try {
      const mod = await import('nats').catch(() => null);
      if (!mod) {
        console.error(JSON.stringify({
          level: 'warn',
          type: 'audit.sink.nats.unavailable',
          message: 'nats package not installed; falling back to stdout sink',
        }));
        return null;
      }
      const nc = await mod.connect({ servers: natsUrl(), name: 'compliance-gateway-audit' });
      natsClient = nc;
      console.log(JSON.stringify({
        level: 'info',
        type: 'audit.sink.nats.connected',
        url: natsUrl(),
        subject: natsSubject(),
      }));
      return nc;
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error',
        type: 'audit.sink.nats.connectFailed',
        error: err.message,
        url: natsUrl(),
      }));
      return null;
    }
  })();
  return natsConnectPromise;
}

function natsSink() {
  // Kick off the connect in the background; stdout serves as the failover.
  connectNats();
  return {
    mode: 'nats',
    emit(record) {
      // Always mirror to stdout so log aggregation has a copy even if
      // JetStream is briefly unreachable.
      console.log(JSON.stringify({ type: 'audit.signed', record }));
      if (!natsClient) return;
      try {
        // Per-tenant subject when the record carries a tenantId in its
        // payload, so the audit-flush sidecar can write per-tenant
        // prefixes into the WORM bucket. Falls back to the bare subject
        // for legacy records or auth events with unknown tenant.
        const tenantId = record?.payload?.tenantId;
        const subject = tenantId && typeof tenantId === 'string' && /^[a-z0-9-]+$/.test(tenantId)
          ? `${natsSubject()}.${tenantId}`
          : natsSubject();
        natsClient.publish(subject, JSON.stringify(record));
      } catch (err) {
        console.error(JSON.stringify({
          level: 'error',
          type: 'audit.sink.nats.publishFailed',
          error: err.message,
        }));
      }
    },
    async close() {
      if (natsClient) {
        try { await natsClient.drain(); } catch { /* shutdown drain — safe to ignore */ }
      }
    },
  };
}

let activeSink = null;

/**
 * Resolve the active audit sink for the process. Lazily constructed so
 * tests can call resetSink() between cases.
 *
 * @returns {AuditSink}
 */
export function getSink() {
  if (activeSink) return activeSink;
  activeSink = sinkMode() === 'nats' ? natsSink() : stdoutSink();
  return activeSink;
}

/**
 * Reset the sink (intended for tests only).
 */
export function resetSink() {
  activeSink = null;
  natsClient = null;
  natsConnectPromise = null;
}

/**
 * Inspectable mode for /health.
 *
 * @returns {{ mode: string, subject?: string, natsConnected?: boolean }}
 */
export function getSinkInfo() {
  const mode = sinkMode();
  return {
    mode: mode === 'nats' ? 'nats' : 'stdout',
    ...(mode === 'nats' ? { subject: natsSubject(), natsConnected: natsClient !== null } : {}),
  };
}
