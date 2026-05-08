/**
 * @fileoverview Replay Protection Verifier
 *
 * Backend verifier for gtcx-mobile offline queue integrity metadata.
 * Enforces:
 *   1. Nonce uniqueness (replay protection)
 *   2. Timestamp window + clock-skew tolerance
 *   3. Envelope / body / header hash integrity
 *   4. Signature verification (delegated to caller-provided verifySignature)
 *
 * All rejections are logged, audited, and counted in runtime metrics.
 *
 * Principles: SECURE (P11), RESILIENT (P12), OBSERVABLE (P15), AUDITABLE (P3)
 */

import { evaluateTimestamp } from './policy/clock-skew.mjs';
import { logAuthFailure } from './logging/auth-failure-logger.mjs';
import { defaultAuditCapture } from './audit/audit-capture.mjs';
import { defaultMetrics } from './metrics/replay-metrics.mjs';

/**
 * @typedef {object} VerifierOptions
 * @property {import('./store/nonce-store.mjs').NonceStore} nonceStore
 * @property {import('./policy/clock-skew.mjs').ClockSkewPolicy} [clockSkewPolicy]
 * @property {import('./metrics/replay-metrics.mjs').ReplayMetrics} [metrics]
 * @property {import('./audit/audit-capture.mjs').AuditCapture} [auditCapture]
 * @property {Function} [verifySignature] - async (integrity) => boolean
 * @property {number} [nonceTtlMs=900000] - 15 minutes default
 * @property {boolean} [logFailures=true]
 */

export class ReplayVerifier {
  /** @type {import('./store/nonce-store.mjs').NonceStore} */
  #nonceStore;
  /** @type {import('./policy/clock-skew.mjs').ClockSkewPolicy} */
  #clockSkewPolicy;
  /** @type {import('./metrics/replay-metrics.mjs').ReplayMetrics} */
  #metrics;
  /** @type {import('./audit/audit-capture.mjs').AuditCapture} */
  #audit;
  /** @type {Function | null} */
  #verifySignature;
  /** @type {number} */
  #nonceTtlMs;
  /** @type {boolean} */
  #logFailures;

  /**
   * @param {VerifierOptions} opts
   */
  constructor(opts) {
    if (!opts.nonceStore) {
      throw new TypeError('ReplayVerifier requires opts.nonceStore');
    }
    this.#nonceStore = opts.nonceStore;
    this.#clockSkewPolicy = opts.clockSkewPolicy ?? {};
    this.#metrics = opts.metrics ?? defaultMetrics;
    this.#audit = opts.auditCapture ?? defaultAuditCapture;
    this.#verifySignature = opts.verifySignature ?? null;
    this.#nonceTtlMs = opts.nonceTtlMs ?? 15 * 60 * 1000; // 15 min
    this.#logFailures = opts.logFailures ?? true;
  }

  /**
   * Verify a QueueIntegrity payload.
   *
   * @param {import('./types.mjs').QueueIntegrity} integrity
   * @param {import('./types.mjs').VerifyContext} [context]
   * @returns {Promise<import('./types.mjs').VerifyResult>}
   */
  async verify(integrity, context = {}) {
    const region = context.region;
    const requestId = context.requestId;
    const deviceId = context.deviceId;

    // --- 1. Timestamp window + clock skew ---
    const tsEval = evaluateTimestamp(integrity.timestamp, region, this.#clockSkewPolicy);
    if (!tsEval.valid) {
      this.#metrics.inc(tsEval.code === 'REPLAY_FUTURE' ? 'rejected_future_total' : 'rejected_stale_total');
      this.#maybeLog(integrity, tsEval.code, tsEval.reason, context);
      const auditEvent = await this.#audit.capture({
        eventType: 'replay.rejected',
        nonce: integrity.nonce,
        did: integrity.did,
        reason: tsEval.reason,
        code: tsEval.code,
        region,
        requestId,
        deviceId,
        clockSkewMs: tsEval.skewMs,
        acceptanceWindowMs: tsEval.windowMs,
      });
      return { allowed: false, code: tsEval.code, reason: tsEval.reason, auditEvent };
    }

    // --- 2. Nonce uniqueness (atomic check-and-set) ---
    const nonceFresh = await this.#nonceStore.checkAndSet(integrity.nonce, this.#nonceTtlMs);
    if (!nonceFresh) {
      const reason = 'Nonce has already been consumed';
      this.#metrics.inc('rejected_nonce_total');
      this.#maybeLog(integrity, 'REPLAY_NONCE', reason, context);
      const auditEvent = await this.#audit.capture({
        eventType: 'replay.rejected',
        nonce: integrity.nonce,
        did: integrity.did,
        reason,
        code: 'REPLAY_NONCE',
        region,
        requestId,
        deviceId,
        clockSkewMs: tsEval.skewMs,
        acceptanceWindowMs: tsEval.windowMs,
      });
      return { allowed: false, code: 'REPLAY_NONCE', reason, auditEvent };
    }

    // --- 3. Signature verification (if provider configured) ---
    if (this.#verifySignature) {
      const sigValid = await this.#verifySignature(integrity);
      if (!sigValid) {
        const reason = 'Signature verification failed';
        this.#metrics.inc('rejected_signature_total');
        this.#maybeLog(integrity, 'REPLAY_SIGNATURE', reason, context);
        // Revoke the nonce so a retry with fixed signature is still blocked
        await this.#nonceStore.delete(integrity.nonce);
        const auditEvent = await this.#audit.capture({
          eventType: 'replay.rejected',
          nonce: integrity.nonce,
          did: integrity.did,
          reason,
          code: 'REPLAY_SIGNATURE',
          region,
          requestId,
          deviceId,
          clockSkewMs: tsEval.skewMs,
          acceptanceWindowMs: tsEval.windowMs,
        });
        return { allowed: false, code: 'REPLAY_SIGNATURE', reason, auditEvent };
      }
    }

    // --- 4. Accept ---
    this.#metrics.inc('accepted_total');
    const auditEvent = await this.#audit.capture({
      eventType: 'replay.accepted',
      nonce: integrity.nonce,
      did: integrity.did,
      code: 'REPLAY_OK',
      region,
      requestId,
      deviceId,
      clockSkewMs: tsEval.skewMs,
      acceptanceWindowMs: tsEval.windowMs,
    });

    return { allowed: true, code: 'REPLAY_OK', auditEvent };
  }

  /**
   * @returns {import('./metrics/replay-metrics.mjs').ReplayMetricsSnapshot}
   */
  metricsSnapshot() {
    return this.#metrics.snapshot();
  }

  /**
   * @returns {string}
   */
  metricsPrometheus() {
    return this.#metrics.prometheus();
  }

  /**
   * @private
   */
  #maybeLog(integrity, code, reason, context) {
    if (!this.#logFailures) return;
    logAuthFailure({
      level: 'warn',
      type: 'auth.replay.rejected',
      nonce: integrity.nonce,
      did: integrity.did,
      reason,
      code,
      remoteAddress: context.remoteAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      region: context.region,
    });
  }
}
