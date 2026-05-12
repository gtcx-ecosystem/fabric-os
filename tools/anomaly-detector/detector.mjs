#!/usr/bin/env node
/**
 * @fileoverview Anomaly Detector — GTCX Compliance Gateway
 *
 * Polls metrics and detects anomalies based on configurable rules.
 * Supports live Prometheus metrics or synthetic data for CI testing.
 *
 * Usage:
 *   node detector.mjs [--threshold=N] [--window=Ms] [--dry-run]
 *   node detector.mjs --synthetic-data=tools/anomaly-detector/test-fixtures/synthetic-metrics.json
 */

import { readFileSync } from 'node:fs';
import { request } from 'node:http';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
const THRESHOLD_MULTIPLIER = Number(process.argv.find((a) => a.startsWith('--threshold='))?.slice(12)) || 10;
const WINDOW_MS = Number(process.argv.find((a) => a.startsWith('--window='))?.slice(9)) || 300_000;
const DRY_RUN = process.argv.includes('--dry-run');
const SYNTHETIC_DATA = process.argv.find((a) => a.startsWith('--synthetic-data='))?.slice(17);

const RULES = {
  query_rate_spike: {
    name: 'query_rate_spike',
    description: 'Query rate spike > threshold × baseline',
    severity: 'high',
    selector(series) {
      // Matches generic query rate metrics (no specific anomaly labels)
      const labels = series.metric || {};
      return !labels.mutating && !labels.code && !labels.did && !labels.role;
    },
    check(series) {
      const value = Number(series.value?.[1] || 0);
      if (value > THRESHOLD_MULTIPLIER) {
        return {
          rule: this.name,
          severity: this.severity,
          value,
          threshold: THRESHOLD_MULTIPLIER,
          labels: series.metric || {},
        };
      }
      return null;
    },
  },
  mutating_tool_without_approval: {
    name: 'mutating_tool_without_approval',
    description: 'Mutating tool invocation without approval ticket',
    severity: 'critical',
    selector(series) {
      const labels = series.metric || {};
      return labels.mutating === 'true' && labels.approved !== 'true';
    },
    check(series) {
      const value = Number(series.value?.[1] || 0);
      if (value > 0) {
        return {
          rule: this.name,
          severity: this.severity,
          value,
          labels: series.metric || {},
        };
      }
      return null;
    },
  },
  replay_rejection_rate: {
    name: 'replay_rejection_rate',
    description: 'Replay rejection rate > 5%',
    severity: 'critical',
    selector(series) {
      const labels = series.metric || {};
      return labels.code === 'REPLAY_NONCE';
    },
    check(series) {
      const value = Number(series.value?.[1] || 0);
      if (value > 0.05) {
        return {
          rule: this.name,
          severity: this.severity,
          value,
          threshold: 0.05,
          labels: series.metric || {},
        };
      }
      return null;
    },
  },
  unknown_did_frequency: {
    name: 'unknown_did_frequency',
    description: 'Unknown DID frequency > 3 per minute',
    severity: 'warning',
    selector(series) {
      const labels = series.metric || {};
      return labels.did && !labels.did.startsWith('did:gtcx:known:');
    },
    check(series) {
      const value = Number(series.value?.[1] || 0);
      if (value > 3) {
        return {
          rule: this.name,
          severity: this.severity,
          value,
          threshold: 3,
          labels: series.metric || {},
        };
      }
      return null;
    },
  },
  off_hours_admin_access: {
    name: 'off_hours_admin_access',
    description: 'Admin access outside 06:00–22:00 CAT',
    severity: 'warning',
    selector(series) {
      const labels = series.metric || {};
      return labels.role === 'admin';
    },
    check(series) {
      const now = new Date();
      // CAT = UTC+2; check if local hour is outside 06-22
      const catHour = (now.getUTCHours() + 2) % 24;
      if (catHour >= 6 && catHour < 22) return null;

      const value = Number(series.value?.[1] || 0);
      if (value > 0) {
        return {
          rule: this.name,
          severity: this.severity,
          value,
          catHour,
          labels: series.metric || {},
        };
      }
      return null;
    },
  },
};

function fetchMetrics() {
  return new Promise((resolve, reject) => {
    const req = request(`${PROMETHEUS_URL}/api/v1/query?query=rate(gtcx_query_total[5m])`, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Prometheus timeout')));
    req.end();
  });
}

function loadSyntheticData(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      type: 'anomaly.detector.error',
      message: `Failed to load synthetic data: ${err.message}`,
    }));
    process.exit(1);
  }
}

function evaluateAllRules(metrics) {
  const allAnomalies = [];
  const seriesList = metrics.data?.result || [];

  for (const rule of Object.values(RULES)) {
    for (const series of seriesList) {
      if (rule.selector(series)) {
        const anomaly = rule.check(series);
        if (anomaly) allAnomalies.push(anomaly);
      }
    }
  }

  return allAnomalies;
}

async function main() {
  console.log(JSON.stringify({
    level: 'info',
    type: 'anomaly.detector.start',
    threshold: THRESHOLD_MULTIPLIER,
    windowMs: WINDOW_MS,
    dryRun: DRY_RUN,
    syntheticData: SYNTHETIC_DATA || null,
    rules: Object.keys(RULES),
  }));

  try {
    const metrics = SYNTHETIC_DATA
      ? loadSyntheticData(SYNTHETIC_DATA)
      : await fetchMetrics();

    if (!metrics || !metrics.data) {
      console.error(JSON.stringify({
        level: 'error',
        type: 'anomaly.detector.error',
        message: SYNTHETIC_DATA ? 'Invalid synthetic data format' : 'No metrics available from Prometheus',
      }));
      process.exit(1);
    }

    const anomalies = evaluateAllRules(metrics);

    if (anomalies.length === 0) {
      console.log(JSON.stringify({
        level: 'info',
        type: 'anomaly.detector.healthy',
        message: 'No anomalies detected',
        rulesEvaluated: Object.keys(RULES).length,
      }));
      process.exit(0);
    }

    for (const a of anomalies) {
      console.error(JSON.stringify({
        level: 'warn',
        type: 'anomaly.detector.triggered',
        timestamp: new Date().toISOString(),
        ...a,
      }));
    }

    if (DRY_RUN) {
      console.log(JSON.stringify({
        level: 'info',
        type: 'anomaly.detector.dry_run_complete',
        anomaliesDetected: anomalies.length,
        message: 'Dry-run mode: anomalies logged but no alerts sent',
      }));
      process.exit(0);
    }

    process.exit(1);
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      type: 'anomaly.detector.error',
      message: err instanceof Error ? err.message : 'unknown error',
    }));
    process.exit(1);
  }
}

main();
