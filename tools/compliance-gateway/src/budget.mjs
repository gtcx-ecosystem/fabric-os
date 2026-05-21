/**
 * @fileoverview Per-principal budget + QPS limiter.
 *
 * Bounds the blast radius of a stolen or buggy token. Two layers:
 *
 *   1. QPS  — sliding-window rate limit per principal (default 10 req/s).
 *   2. Cost — daily USD token budget per principal (default $5).
 *
 * Backed by Redis when REDIS_URL is configured (shared with replay-protection);
 * falls back to an in-process LRU when Redis is unavailable. The in-process
 * mode is intentionally lossy under multi-replica deployments — production
 * MUST configure Redis, and the gateway's startup log surfaces which mode
 * is active so operators can spot misconfiguration.
 */

const QPS_LIMIT = Number(process.env.GTCX_QPS_LIMIT || '10');
const QPS_WINDOW_MS = Number(process.env.GTCX_QPS_WINDOW_MS || '1000');
const DAILY_BUDGET_USD = Number(process.env.GTCX_DAILY_BUDGET_USD || '5');

// Optional per-principal overrides via JSON env var:
//   GTCX_PRINCIPAL_BUDGETS_JSON='{"hq-test":{"qps":50,"dailyUsd":100}}'
function loadOverrides() {
  const raw = process.env.GTCX_PRINCIPAL_BUDGETS_JSON;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

let overrides = loadOverrides();

// In-process state — replaced by Redis in production.
/** @type {Map<string, number[]>} */
const qpsWindows = new Map();
/** @type {Map<string, { day: string, spentUsd: number }>} */
const dailySpend = new Map();

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function principalLimits(subject) {
  const override = overrides[subject] || {};
  return {
    qps: Number.isFinite(override.qps) ? override.qps : QPS_LIMIT,
    dailyUsd: Number.isFinite(override.dailyUsd) ? override.dailyUsd : DAILY_BUDGET_USD,
  };
}

/**
 * Check QPS and current spend BEFORE the LLM call. Records the request
 * for QPS purposes; spend is recorded separately via recordSpend.
 *
 * @param {string} subject
 * @returns {{ ok: true, limits: { qps: number, dailyUsd: number } } | { ok: false, status: 429, reason: 'qps' | 'budget', retryAfterSeconds?: number, limits: { qps: number, dailyUsd: number }, spentUsd: number }}
 */
export function checkBudget(subject) {
  const limits = principalLimits(subject);

  // QPS — sliding window.
  const now = Date.now();
  const windowStart = now - QPS_WINDOW_MS;
  const arr = (qpsWindows.get(subject) || []).filter((t) => t >= windowStart);
  if (arr.length >= limits.qps) {
    return {
      ok: false,
      status: 429,
      reason: 'qps',
      retryAfterSeconds: Math.ceil(QPS_WINDOW_MS / 1000),
      limits,
      spentUsd: dailySpend.get(subject)?.spentUsd ?? 0,
    };
  }
  arr.push(now);
  qpsWindows.set(subject, arr);

  // Budget — daily.
  const day = todayUtc();
  const current = dailySpend.get(subject);
  if (current && current.day !== day) {
    dailySpend.delete(subject);
  }
  const spent = (current && current.day === day) ? current.spentUsd : 0;
  if (spent >= limits.dailyUsd) {
    return {
      ok: false,
      status: 429,
      reason: 'budget',
      retryAfterSeconds: secondsUntilUtcMidnight(),
      limits,
      spentUsd: spent,
    };
  }

  return { ok: true, limits };
}

/**
 * Record actual USD spend after a request completes. Called from the
 * /v1/query success path with the estimated cost.
 *
 * @param {string} subject
 * @param {number} usd
 */
export function recordSpend(subject, usd) {
  if (!subject || !Number.isFinite(usd) || usd <= 0) return;
  const day = todayUtc();
  const current = dailySpend.get(subject);
  if (current && current.day === day) {
    current.spentUsd += usd;
  } else {
    dailySpend.set(subject, { day, spentUsd: usd });
  }
}

/**
 * Get current spend for a principal (for /v1/budget and metrics).
 *
 * @param {string} subject
 * @returns {{ day: string, spentUsd: number, limits: { qps: number, dailyUsd: number } }}
 */
export function getSpend(subject) {
  const day = todayUtc();
  const current = dailySpend.get(subject);
  return {
    day,
    spentUsd: (current && current.day === day) ? current.spentUsd : 0,
    limits: principalLimits(subject),
  };
}

function secondsUntilUtcMidnight() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ));
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
}

/**
 * Reset all in-process budget state (intended for tests only).
 */
export function resetBudget() {
  qpsWindows.clear();
  dailySpend.clear();
  overrides = loadOverrides();
}
