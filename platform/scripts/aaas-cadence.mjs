#!/usr/bin/env node
/**
 * AAAS — Audit-as-a-Service cadence runner (AAAS-S3).
 *
 * Turns assurance from on-demand into a regular heartbeat: refreshes the friction
 * + honesty witnesses (--write) and asserts the core witnesses are fresh, so
 * "witnesses rot" (audit finding ASR-007) becomes a visible, gating signal rather
 * than silent staleness.
 *
 * Usage: node aaas-cadence.mjs [--repo <name>] [--write] [--json] [--strict] [--max-age-days N]
 *   --write   regenerate friction + honesty witnesses before checking freshness
 *   --strict  exit nonzero when any monitored witness is stale or undateable
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { extractPillars } from './lib/aaas-handoff.mjs';
import { evaluatePredictive, appendSnapshot } from './lib/aaas-cadence-predict.mjs';

const DAY = 86_400_000;
const DATE_FIELDS = ['checkedAt', 'updated', 'evaluatedAt', 'date', 'generatedAt'];
const SELF = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repoArg = process.argv.includes('--repo') ? process.argv[process.argv.indexOf('--repo') + 1] : null;
const ROOT = repoArg ? join(SELF, '..', repoArg) : SELF;
const REPO = repoArg ?? 'fabric-os';

/** First present, parseable date-ish field → epoch ms, else null. */
export function extractDateMs(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const f of DATE_FIELDS) {
    if (obj[f]) {
      const ms = Date.parse(obj[f]);
      if (!Number.isNaN(ms)) return ms;
    }
  }
  return null;
}

/**
 * Pure freshness evaluation. witnesses: [{ id, dateMs|null }].
 * A null date is treated as not-verifiable (fails) — absence is not freshness.
 */
export function evaluateStaleness({ witnesses, nowMs, maxAgeDays }) {
  const maxAgeMs = maxAgeDays * DAY;
  const stale = [];
  const unknown = [];
  const fresh = [];
  let oldestAgeDays = 0;
  for (const w of witnesses) {
    if (w.dateMs == null) {
      unknown.push(w.id);
      continue;
    }
    const ageDays = (nowMs - w.dateMs) / DAY;
    if (ageDays > oldestAgeDays) oldestAgeDays = ageDays;
    if (nowMs - w.dateMs > maxAgeMs) stale.push(w.id);
    else fresh.push(w.id);
  }
  const ok = stale.length === 0 && unknown.length === 0;
  const witness = {
    schema: 'gtcx://fabric-os/aaas-cadence/v1',
    maxAgeDays,
    counts: { total: witnesses.length, fresh: fresh.length, stale: stale.length, unknown: unknown.length },
    oldestAgeDays: Math.round(oldestAgeDays),
    stale,
    unknown,
    fresh,
    ok,
  };
  return { witness, ok };
}

/**
 * Predictive layer (§4c.2): snapshot the current MPR pillar scores into a history
 * ledger, then compute trends / regressions / breach forecasts. On --write the
 * snapshot is appended (the heartbeat advances history); read-only runs forecast
 * against existing history without polluting it. Returns the forecast witness, or
 * null when there is no MPR witness to read.
 */
function runPredictive(ROOT, WRITE, nowIso, repo) {
  const mprPath = join(ROOT, 'audit/evidence/mpr-repo-latest.json');
  if (!existsSync(mprPath)) return null;
  let mpr = null;
  try { mpr = JSON.parse(readFileSync(mprPath, 'utf8')); } catch { return null; }
  const pillars = extractPillars(mpr).filter((p) => typeof p.score === 'number');
  if (!pillars.length) return null;

  const metrics = {};
  const thresholds = {};
  for (const p of pillars) { metrics[p.pillar] = p.score; thresholds[p.pillar] = p.threshold; }

  const HIST = join(ROOT, 'audit/evidence/aaas-cadence-history.json');
  let history = [];
  if (existsSync(HIST)) {
    try { history = JSON.parse(readFileSync(HIST, 'utf8')).points ?? []; } catch { history = []; }
  }
  const snapshot = { ts: nowIso, metrics };
  // forecast against history INCLUDING the current point
  const effective = appendSnapshot(history, snapshot);
  const witness = evaluatePredictive({ history: effective, thresholds });
  witness.checkedAt = nowIso;
  witness.repo = repo;

  if (WRITE) {
    mkdirSync(dirname(HIST), { recursive: true });
    writeFileSync(HIST, `${JSON.stringify({ schema: 'gtcx://fabric-os/aaas-cadence-history/v1', points: effective }, null, 2)}\n`);
    writeFileSync(join(ROOT, 'audit/evidence/aaas-cadence-forecast-latest.json'), `${JSON.stringify(witness, null, 2)}\n`);
  }
  return witness;
}

// Witnesses whose freshness the cadence guarantees.
const MONITORED = [
  'aaas-friction-check-latest.json',
  'aaas-honesty-gate-latest.json',
  'aaas-adversarial-honesty-latest.json',
  'mpr-repo-latest.json',
  'signal-maturity-latest.json',
];

function main() {
  const WRITE = process.argv.includes('--write');
  const JSON_OUT = process.argv.includes('--json');
  const STRICT = process.argv.includes('--strict');
  const ageIdx = process.argv.indexOf('--max-age-days');
  const maxAgeDays = ageIdx !== -1 ? Number(process.argv[ageIdx + 1]) : 3;
  const OUT = join(ROOT, 'audit/evidence/aaas-cadence-latest.json');

  // Heartbeat: refresh the witnesses fabric-os owns locally.
  if (WRITE && !repoArg) {
    for (const args of [
      ['platform/scripts/aaas-friction-check.mjs', '--write'],
      ['platform/scripts/aaas-honesty-gate.mjs', '--write'],
    ]) {
      spawnSync('node', args, { cwd: ROOT, encoding: 'utf8', shell: false });
    }
  }

  const witnesses = MONITORED.map((name) => {
    const path = join(ROOT, 'audit/evidence', name);
    let dateMs = null;
    if (existsSync(path)) {
      try {
        dateMs = extractDateMs(JSON.parse(readFileSync(path, 'utf8')));
      } catch {
        dateMs = null;
      }
    }
    return { id: name.replace(/-latest\.json$/, ''), dateMs };
  });

  const nowIso = new Date().toISOString();
  const { witness, ok } = evaluateStaleness({ witnesses, nowMs: Date.now(), maxAgeDays });
  witness.checkedAt = nowIso;
  witness.repo = REPO;

  // Only persist on --write. Read-only/--json/test runs must not mutate the tree
  // (self-audit: the unconditional write dirtied the working tree on every invocation).
  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  // Predictive layer — trends, regressions, breach forecasts (§4c.2).
  const forecast = runPredictive(ROOT, WRITE, nowIso, REPO);
  const noRegression = !forecast || forecast.ok;

  if (JSON_OUT) {
    console.log(JSON.stringify({ freshness: witness, forecast }, null, 2));
  } else {
    console.log(`cadence · max-age ${maxAgeDays}d · oldest ${witness.oldestAgeDays}d`);
    for (const id of witness.fresh) console.log(`OK   ${id}`);
    for (const id of witness.stale) console.log(`STALE ${id}`);
    for (const id of witness.unknown) console.log(`UNDATED ${id}`);
    console.log(`\n${ok ? 'PASS' : 'WARN'} — AAAS cadence freshness (witness: ${OUT})`);
    if (forecast) {
      console.log(`\nforecast · ${forecast.snapshots} snapshot(s)${forecast.intervalDays ? ` · ~${forecast.intervalDays}d apart` : ''}`);
      for (const r of forecast.regressions) {
        console.log(`REGRESS ${r.metric}: ${r.from} -> ${r.to} (${r.severity}, thr ${r.threshold})`);
      }
      for (const f of forecast.forecasts) {
        console.log(`FORECAST ${f.metric}: breach thr ${f.threshold} in ~${f.breachInSnapshots} snapshot(s)${f.breachInDays != null ? ` (~${f.breachInDays}d)` : ''}`);
      }
      if (!forecast.regressions.length && !forecast.forecasts.length) console.log('no regressions or impending breaches');
    } else {
      console.log('\nforecast · skipped (no mpr-repo-latest.json to snapshot)');
    }
  }

  // strict fails on staleness OR a regression (crossed-below) — proactive gating.
  process.exit(STRICT && (!ok || !noRegression) ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
