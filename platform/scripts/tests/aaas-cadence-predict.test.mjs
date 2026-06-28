#!/usr/bin/env node
/**
 * AaaS predictive cadence — validation suite.
 * Guards the L5 Monitoring math: trend slope, regression detection (incl.
 * crossing back below a cleared threshold), and breach forecasting.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  slope, forecastBreach, evaluateMetric, evaluatePredictive, appendSnapshot, meanIntervalDays,
} from '../lib/aaas-cadence-predict.mjs';

describe('slope', () => {
  it('is positive for an improving series, negative for declining, ~0 for flat', () => {
    assert.ok(slope([10, 20, 30]) > 0);
    assert.ok(slope([90, 80, 70]) < 0);
    assert.equal(slope([50, 50, 50]), 0);
    assert.equal(slope([42]), 0); // < 2 points
  });
});

describe('forecastBreach', () => {
  it('predicts snapshots until a declining metric crosses the threshold', () => {
    // 95 -> 90 -> 85 (slope -5), threshold 80: 1 snapshot to breach
    assert.equal(forecastBreach([95, 90, 85], 80), 1);
  });
  it('returns null when flat or improving (no breach ahead)', () => {
    assert.equal(forecastBreach([90, 90, 90], 80), null);
    assert.equal(forecastBreach([80, 85, 90], 80), null);
  });
  it('returns 0 when already below the threshold', () => {
    assert.equal(forecastBreach([70, 65], 80), 0);
  });
});

describe('evaluateMetric', () => {
  it('flags a crossing back below a cleared threshold (regression)', () => {
    const ev = evaluateMetric([88, 90, 82], 85);
    assert.equal(ev.crossedBelow, true);
    assert.equal(ev.regressed, true);
    assert.equal(ev.trend, 'declining');
  });
  it('does not flag an improving metric', () => {
    const ev = evaluateMetric([70, 78, 86], 85);
    assert.equal(ev.regressed, false);
    assert.equal(ev.crossedBelow, false);
    assert.equal(ev.trend, 'improving');
  });
});

describe('meanIntervalDays', () => {
  it('computes average day-gap between timestamped points', () => {
    const d = meanIntervalDays([
      { ts: '2026-06-01T00:00:00Z' },
      { ts: '2026-06-08T00:00:00Z' },
      { ts: '2026-06-15T00:00:00Z' },
    ]);
    assert.equal(d, 7);
    assert.equal(meanIntervalDays([{ ts: 'x' }]), null);
  });
});

describe('evaluatePredictive', () => {
  const history = [
    { ts: '2026-06-01T00:00:00Z', metrics: { compliance: 95, craft: 60 } },
    { ts: '2026-06-08T00:00:00Z', metrics: { compliance: 90, craft: 70 } },
    { ts: '2026-06-15T00:00:00Z', metrics: { compliance: 85, craft: 80 } },
  ];

  it('forecasts the soonest breach and attaches day estimates', () => {
    const w = evaluatePredictive({ history, defaultThreshold: 80 });
    // compliance declining 95->85 (slope -5), threshold 80 -> 1 snapshot, 7d interval
    const f = w.forecasts.find((x) => x.metric === 'compliance');
    assert.ok(f, 'expected a compliance forecast');
    assert.equal(f.breachInSnapshots, 1);
    assert.equal(f.breachInDays, 7);
  });

  it('does not forecast a breach for an improving metric', () => {
    const w = evaluatePredictive({ history, defaultThreshold: 80 });
    assert.equal(w.forecasts.find((x) => x.metric === 'craft'), undefined);
  });

  it('flags regressions and reports ok=false when present', () => {
    const reg = [
      { ts: '2026-06-01T00:00:00Z', metrics: { trustAndSafety: 90 } },
      { ts: '2026-06-08T00:00:00Z', metrics: { trustAndSafety: 82 } },
    ];
    const w = evaluatePredictive({ history: reg, defaultThreshold: 85 });
    assert.equal(w.ok, false);
    assert.equal(w.regressions[0].metric, 'trustAndSafety');
    assert.equal(w.regressions[0].severity, 'crossed-below');
  });

  it('handles per-metric thresholds and is empty-safe', () => {
    const w = evaluatePredictive({ history, thresholds: { compliance: 95 } });
    assert.equal(w.metrics.compliance.threshold, 95);
    const empty = evaluatePredictive({ history: [] });
    assert.equal(empty.metricCount, 0);
    assert.equal(empty.ok, true);
  });
});

describe('appendSnapshot', () => {
  it('appends and caps to the most recent N', () => {
    let h = [];
    for (let i = 0; i < 35; i += 1) h = appendSnapshot(h, { ts: `t${i}`, metrics: { a: i } }, 30);
    assert.equal(h.length, 30);
    assert.equal(h[0].metrics.a, 5); // oldest 5 dropped
    assert.equal(h[h.length - 1].metrics.a, 34);
  });
});
