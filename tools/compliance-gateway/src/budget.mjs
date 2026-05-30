/**
 * @fileoverview Per-principal budget + QPS limiter.
 *
 * Bounds the blast radius of a stolen or buggy token. Two layers:
 *
 *   1. QPS  — sliding-window rate limit per principal (default 10 req/s).
 *   2. Cost — daily USD token budget per principal (default $5).
 *
 * STORAGE — PER-POD, IN-PROCESS.
 *
 * The prior docstring claimed Redis backing "when REDIS_URL is
 * configured"; no Redis path existed. Under HPA (1→8 pods) the
 * documented per-principal QPS limit was silently multiplied by
 * replica count — at 8 pods, an attacker holding one token could
 * issue 8× the limit before being throttled. The audit on
 * 2026-05-30 flagged this as a P1.
 *
 * The honest behavior today: each pod enforces the limit
 * independently. For a low-traffic pilot at <100 req/min this is
 * acceptable; for ZWCMP / multi-tenant production it is not.
 *
 * Cross-pod enforcement is available via `./budget-store.mjs`, a
 * Redis-backed primitive that mirrors this module's API. Wiring it
 * into the hot path requires migrating checkBudget/recordSpend/
 * getSpend to async — a follow-up tracked in the S4.3 plan note in
 * docs/audit/internal-10-10-sprint-plan-2026-05-27.md. Until that
 * migration lands, operators should be aware that HPA-replica count
 * multiplies the documented per-principal cap.
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

function principalLimits(subject, tenantId = 'default') {
  // Override resolution order: tenant-scoped > subject-scoped > defaults.
  const tenantOverride = overrides[`tenant:${tenantId}`] || {};
  const subjectOverride = overrides[subject] || {};
  const merged = { ...tenantOverride, ...subjectOverride };
  return {
    qps: Number.isFinite(merged.qps) ? merged.qps : QPS_LIMIT,
    dailyUsd: Number.isFinite(merged.dailyUsd) ? merged.dailyUsd : DAILY_BUDGET_USD,
  };
}

/**
 * Check QPS and current spend BEFORE the LLM call. Records the request
 * for QPS purposes; spend is recorded separately via recordSpend.
 *
 * @param {string} subject
 * @returns {{ ok: true, limits: { qps: number, dailyUsd: number } } | { ok: false, status: 429, reason: 'qps' | 'budget', retryAfterSeconds?: number, limits: { qps: number, dailyUsd: number }, spentUsd: number }}
 */
export function checkBudget(subject, tenantId = 'default') {
  const limits = principalLimits(subject, tenantId);

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
export function getSpend(subject, tenantId = 'default') {
  const day = todayUtc();
  const current = dailySpend.get(subject);
  return {
    day,
    subject,
    tenantId,
    spentUsd: (current && current.day === day) ? current.spentUsd : 0,
    limits: principalLimits(subject, tenantId),
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
