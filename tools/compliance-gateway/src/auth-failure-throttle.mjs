/**
 * @fileoverview Per-IP throttle on the auth-failure path.
 *
 * The auth-failure handler in server.mjs signs and chain-appends an
 * audit record on every rejected request. Without a rate limit, a
 * bearer brute-force at the ALB's allowed rate (e.g. 100 req/s) turns
 * into an audit-DoS amplifier: 100 Ed25519 signatures + chain appends
 * per second per attacker. The legitimate audit signal is buried; the
 * in-memory chain checkpoint flips constantly; downstream JetStream +
 * WORM ingest pays the cost.
 *
 * Fix: count auth failures per source IP in a sliding window. Once
 * the threshold is crossed, return 429 immediately AND skip the
 * signAuditEvent call entirely (still increment a metric counter so
 * operators see the abuse pattern on the dashboard).
 *
 * Constants are intentionally generous — a real on-call rotation
 * occasionally types tokens wrong; we're throttling abuse, not
 * humans.
 */

const DEFAULT_THRESHOLD = Number(process.env.GTCX_AUTH_FAILURE_THRESHOLD || 20);
const DEFAULT_WINDOW_MS = Number(process.env.GTCX_AUTH_FAILURE_WINDOW_MS || 60_000);

/** @type {Map<string, { count: number, firstFailMs: number, throttledUntilMs: number }>} */
const ipState = new Map();

/**
 * @typedef {object} ThrottleConfig
 * @property {number} [threshold=20]   - failures in window before throttle
 * @property {number} [windowMs=60000] - rolling window length in ms
 * @property {number} [throttleMs]     - duration of the 429 lockout; defaults to windowMs
 */

/**
 * Check whether the given IP is currently throttled. Side-effect free.
 * Reads existing state set by `recordAuthFailure`; takes no config
 * because the lockout-until timestamp is already baked into state.
 *
 * @param {string} ip
 * @returns {{ throttled: boolean, retryAfterSeconds?: number }}
 */
export function isAuthThrottled(ip) {
  const now = Date.now();
  const state = ipState.get(ip);
  if (!state) return { throttled: false };
  if (state.throttledUntilMs <= now) return { throttled: false };
  return {
    throttled: true,
    retryAfterSeconds: Math.max(1, Math.ceil((state.throttledUntilMs - now) / 1000)),
  };
}

/**
 * Record an auth failure for the given IP. Returns the post-update
 * state so the caller can decide whether to log abuse-detected.
 *
 * @param {string} ip
 * @param {ThrottleConfig} [cfg]
 * @returns {{ count: number, throttled: boolean, retryAfterSeconds?: number }}
 */
export function recordAuthFailure(ip, cfg = {}) {
  const threshold = cfg.threshold ?? DEFAULT_THRESHOLD;
  const windowMs = cfg.windowMs ?? DEFAULT_WINDOW_MS;
  const throttleMs = cfg.throttleMs ?? windowMs;
  const now = Date.now();

  let state = ipState.get(ip);
  if (!state || now - state.firstFailMs > windowMs) {
    state = { count: 0, firstFailMs: now, throttledUntilMs: 0 };
    ipState.set(ip, state);
  }
  state.count += 1;

  if (state.count >= threshold && state.throttledUntilMs <= now) {
    state.throttledUntilMs = now + throttleMs;
  }

  if (state.throttledUntilMs > now) {
    return {
      count: state.count,
      throttled: true,
      retryAfterSeconds: Math.max(1, Math.ceil((state.throttledUntilMs - now) / 1000)),
    };
  }
  return { count: state.count, throttled: false };
}

/**
 * Clear the failure counter on auth success — humans who fat-fingered
 * their token once and then logged in correctly shouldn't carry a
 * counter forward into the next session.
 *
 * @param {string} ip
 */
export function clearAuthFailures(ip) {
  ipState.delete(ip);
}

/**
 * Extract the source IP from an http.IncomingMessage, preferring
 * X-Forwarded-For first hop (set by the ALB) when present.
 *
 * @param {import('node:http').IncomingMessage} req
 * @returns {string}
 */
export function sourceIpFromRequest(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

/**
 * Test-only.
 */
export function _resetForTests() {
  ipState.clear();
}
