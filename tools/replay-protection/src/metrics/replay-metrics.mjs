/**
 * @fileoverview Replay Metrics
 *
 * Runtime counters for every replay-protection decision.
 * Exported as a snapshot suitable for Prometheus scraping or OTLP push.
 *
 * Exit gate: replay and stale-request rejection MUST be measurable
 * in runtime, not just present in code.
 *
 * Principles: OBSERVABLE (P15)
 */

const LABELS = Object.freeze([
  'accepted_total',
  'rejected_nonce_total',
  'rejected_stale_total',
  'rejected_future_total',
  'rejected_signature_total',
  'rejected_envelope_total',
]);

export class ReplayMetrics {
  /** @type {Map<string, number>} */
  #counters = new Map(LABELS.map((l) => [l, 0]));
  /** @type {boolean} */
  #enabled;

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.enabled=true]
   */
  constructor(opts = {}) {
    this.#enabled = opts.enabled ?? true;
  }

  /**
   * Increment a counter.
   *
   * @param {'accepted_total'|'rejected_nonce_total'|'rejected_stale_total'|'rejected_future_total'|'rejected_signature_total'|'rejected_envelope_total'} label
   * @param {number} [delta=1]
   */
  inc(label, delta = 1) {
    if (!this.#enabled) return;
    const current = this.#counters.get(label) ?? 0;
    this.#counters.set(label, current + delta);
  }

  /**
   * Return a snapshot of all counters.
   *
   * @returns {import('../types.mjs').ReplayMetricsSnapshot}
   */
  snapshot() {
    return {
      acceptedTotal: this.#counters.get('accepted_total') ?? 0,
      rejectedNonceTotal: this.#counters.get('rejected_nonce_total') ?? 0,
      rejectedStaleTotal: this.#counters.get('rejected_stale_total') ?? 0,
      rejectedFutureTotal: this.#counters.get('rejected_future_total') ?? 0,
      rejectedSignatureTotal: this.#counters.get('rejected_signature_total') ?? 0,
      rejectedEnvelopeTotal: this.#counters.get('rejected_envelope_total') ?? 0,
    };
  }

  /**
   * Export in Prometheus exposition format.
   *
   * @returns {string}
   */
  prometheus() {
    const snap = this.snapshot();
    const lines = [
      '# HELP replay_protection_total Total replay-protection decisions',
      '# TYPE replay_protection_total counter',
      `replay_protection_total{code="REPLAY_OK"} ${snap.acceptedTotal}`,
      `replay_protection_total{code="REPLAY_NONCE"} ${snap.rejectedNonceTotal}`,
      `replay_protection_total{code="REPLAY_STALE"} ${snap.rejectedStaleTotal}`,
      `replay_protection_total{code="REPLAY_FUTURE"} ${snap.rejectedFutureTotal}`,
      `replay_protection_total{code="REPLAY_SIGNATURE"} ${snap.rejectedSignatureTotal}`,
      `replay_protection_total{code="REPLAY_ENVELOPE"} ${snap.rejectedEnvelopeTotal}`,
    ];
    return lines.join('\n') + '\n';
  }

  reset() {
    for (const label of LABELS) {
      this.#counters.set(label, 0);
    }
  }
}

/** Singleton for process-wide metrics. */
export const defaultMetrics = new ReplayMetrics();
