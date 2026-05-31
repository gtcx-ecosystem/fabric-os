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
const DEFAULT_MAX_IPS = Number(process.env.GTCX_AUTH_FAILURE_MAX_IPS || 10_000);

/** @type {Map<string, { count: number, firstFailMs: number, throttledUntilMs: number, lastSeenMs: number }>} */
const ipState = new Map();

/**
 * @typedef {object} ThrottleConfig
 * @property {number} [threshold=20]   - failures in window before throttle
 * @property {number} [windowMs=60000] - rolling window length in ms
 * @property {number} [throttleMs]     - duration of the 429 lockout; defaults to windowMs
 * @property {number} [maxIps=10000]   - maximum tracked source IPs
 */

function normalizeConfig(cfg = {}) {
  const threshold = cfg.threshold ?? DEFAULT_THRESHOLD;
  const windowMs = cfg.windowMs ?? DEFAULT_WINDOW_MS;
  const throttleMs = cfg.throttleMs ?? windowMs;
  const maxIps = cfg.maxIps ?? DEFAULT_MAX_IPS;
  return { threshold, windowMs, throttleMs, maxIps };
}

function retryAfterSeconds(untilMs, now) {
  return Math.max(1, Math.ceil((untilMs - now) / 1000));
}

function isLiveState(state, now, windowMs) {
  return state.throttledUntilMs > now || now - state.firstFailMs <= windowMs;
}

function touchIp(ip, state) {
  ipState.delete(ip);
  ipState.set(ip, state);
}

function pruneState(now, cfg, protectedIp) {
  for (const [ip, state] of ipState) {
    if (ip !== protectedIp && !isLiveState(state, now, cfg.windowMs)) {
      ipState.delete(ip);
    }
  }

  const maxIps = Math.max(1, Math.floor(cfg.maxIps));
  while (ipState.size > maxIps) {
    let evicted = false;
    for (const [ip] of ipState) {
      if (ip === protectedIp && ipState.size === 1) break;
      if (ip === protectedIp) continue;
      ipState.delete(ip);
      evicted = true;
      break;
    }
    if (!evicted) break;
  }
}

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
  state.lastSeenMs = now;
  touchIp(ip, state);
  if (state.throttledUntilMs <= now) return { throttled: false };
  return {
    throttled: true,
    retryAfterSeconds: retryAfterSeconds(state.throttledUntilMs, now),
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
  const normalized = normalizeConfig(cfg);
  const now = Date.now();

  let state = ipState.get(ip);
  if (!state || !isLiveState(state, now, normalized.windowMs)) {
    state = { count: 0, firstFailMs: now, throttledUntilMs: 0, lastSeenMs: now };
  }
  state.lastSeenMs = now;
  state.count += 1;

  if (state.count >= normalized.threshold && state.throttledUntilMs <= now) {
    state.throttledUntilMs = now + normalized.throttleMs;
  }

  touchIp(ip, state);
  pruneState(now, normalized, ip);

  if (state.throttledUntilMs > now) {
    return {
      count: state.count,
      throttled: true,
      retryAfterSeconds: retryAfterSeconds(state.throttledUntilMs, now),
    };
  }
  return { count: state.count, throttled: false };
}

/**
 * Atomically record a failure and decide whether the caller may still
 * emit the regulator-facing auth-failure audit event. Existing lockouts
 * do not extend the window; newly-crossed thresholds return `shouldSign`
 * false so the threshold-crossing request does not amplify into another
 * signed audit record.
 *
 * @param {string} ip
 * @param {ThrottleConfig} [cfg]
 * @returns {{ count: number, throttled: boolean, alreadyThrottled: boolean, shouldSign: boolean, retryAfterSeconds?: number }}
 */
export function recordAndCheckAuthFailure(ip, cfg = {}) {
  const normalized = normalizeConfig(cfg);
  const now = Date.now();
  const state = ipState.get(ip);
  if (state?.throttledUntilMs > now) {
    state.lastSeenMs = now;
    touchIp(ip, state);
    pruneState(now, normalized, ip);
    return {
      count: state.count,
      throttled: true,
      alreadyThrottled: true,
      shouldSign: false,
      retryAfterSeconds: retryAfterSeconds(state.throttledUntilMs, now),
    };
  }

  const updated = recordAuthFailure(ip, normalized);
  return {
    ...updated,
    alreadyThrottled: false,
    shouldSign: !updated.throttled,
  };
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

/**
 * Test-only.
 */
export function _stateSizeForTests() {
  return ipState.size;
}
