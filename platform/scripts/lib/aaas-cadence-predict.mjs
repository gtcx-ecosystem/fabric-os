/**
 * AaaS predictive cadence — pure functions (no fs).
 *
 * The L5 Monitoring addition (§4c.2 of the framework design): turn cadence from
 * "is the witness fresh?" into "where is each metric heading?". Over a history of
 * score snapshots it computes per-metric trend lines, detects regressions (a metric
 * dropping — especially back below a threshold it had cleared), and forecasts the
 * next threshold breach. Alerts before failure, not after.
 *
 * Metric = an MPR pillar score (0-100) or a SIGNAL dimension level (0-5). Both are
 * just numeric series here; the caller supplies the threshold per metric.
 */

const DAY = 86_400_000;

/** Least-squares slope of y over its index (per-snapshot change). 0 for < 2 points. */
export function slope(series) {
  const n = series.length;
  if (n < 2) return 0;
  const xbar = (n - 1) / 2;
  const ybar = series.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (i - xbar) * (series[i] - ybar);
    den += (i - xbar) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Forecast snapshots-until-breach for a metric heading toward a threshold.
 * Returns a positive number of snapshots, 0 if already breached, or null if the
 * metric is stable/improving and not heading for a breach.
 */
export function forecastBreach(series, threshold) {
  if (!series.length) return null;
  const current = series[series.length - 1];
  const m = slope(series);
  if (current < threshold) return 0; // already below the line
  if (m >= 0) return null; // flat or improving — no breach ahead
  const snaps = (current - threshold) / -m;
  return Math.max(0, Math.round(snaps * 10) / 10);
}

/** Average real-time gap between timestamped points, in days (null if < 2 or undated). */
export function meanIntervalDays(points) {
  const ts = points.map((p) => Date.parse(p.ts)).filter((n) => !Number.isNaN(n));
  if (ts.length < 2) return null;
  const span = ts[ts.length - 1] - ts[0];
  return span > 0 ? span / (ts.length - 1) / DAY : null;
}

/**
 * Evaluate one metric's series against its threshold.
 * Returns { current, previous, trend, delta, regressed, crossedBelow, forecastSnaps }.
 */
export function evaluateMetric(series, threshold) {
  const current = series[series.length - 1] ?? null;
  const previous = series.length >= 2 ? series[series.length - 2] : null;
  const delta = current != null && previous != null ? current - previous : 0;
  const m = slope(series);
  const trend = m > 0.5 ? 'improving' : m < -0.5 ? 'declining' : 'flat';
  const regressed = previous != null && current < previous;
  const crossedBelow = previous != null && previous >= threshold && current < threshold;
  return {
    current,
    previous,
    trend,
    slopePerSnapshot: Math.round(m * 100) / 100,
    delta: Math.round(delta * 100) / 100,
    regressed,
    crossedBelow,
    forecastSnaps: forecastBreach(series, threshold),
  };
}

/**
 * Build the predictive witness from a history of snapshots.
 * history: [{ ts, metrics: { name: value } }]  (oldest → newest)
 * thresholds: { name: number }  (default applied via defaultThreshold)
 */
export function evaluatePredictive({ history, thresholds = {}, defaultThreshold = 85 }) {
  const points = history ?? [];
  const names = new Set();
  for (const p of points) for (const k of Object.keys(p.metrics ?? {})) names.add(k);

  const metrics = {};
  const regressions = [];
  const forecasts = [];
  for (const name of names) {
    const series = points
      .map((p) => p.metrics?.[name])
      .filter((v) => typeof v === 'number');
    if (!series.length) continue;
    const thr = thresholds[name] ?? defaultThreshold;
    const ev = evaluateMetric(series, thr);
    metrics[name] = { ...ev, threshold: thr };
    if (ev.crossedBelow) {
      regressions.push({ metric: name, from: ev.previous, to: ev.current, threshold: thr, severity: 'crossed-below' });
    } else if (ev.regressed) {
      regressions.push({ metric: name, from: ev.previous, to: ev.current, threshold: thr, severity: 'declining' });
    }
    if (ev.forecastSnaps != null && ev.forecastSnaps > 0 && ev.current >= thr) {
      forecasts.push({ metric: name, current: ev.current, threshold: thr, breachInSnapshots: ev.forecastSnaps });
    }
  }

  const intervalDays = meanIntervalDays(points);
  if (intervalDays) {
    for (const f of forecasts) f.breachInDays = Math.round(f.breachInSnapshots * intervalDays * 10) / 10;
  }
  // soonest breach first; worst regression (crossed-below) first
  forecasts.sort((a, b) => a.breachInSnapshots - b.breachInSnapshots);
  regressions.sort((a, b) => (a.severity === 'crossed-below' ? 0 : 1) - (b.severity === 'crossed-below' ? 0 : 1));

  return {
    schema: 'gtcx://fabric-os/aaas-cadence-forecast/v1',
    snapshots: points.length,
    intervalDays: intervalDays ? Math.round(intervalDays * 10) / 10 : null,
    metricCount: Object.keys(metrics).length,
    regressions,
    forecasts,
    metrics,
    ok: regressions.length === 0,
  };
}

/** Append a snapshot to history (pure); cap to the most recent `max` points. */
export function appendSnapshot(history, snapshot, max = 30) {
  const next = [...(history ?? []), snapshot];
  return next.slice(Math.max(0, next.length - max));
}
