#!/usr/bin/env node
/**
 * Q3-FABRIC-04 — Fleet observability witness for pilot ship gate dashboards.
 * Covers markets-os + gtcx-os staging namespace workloads and pilot gate witnesses.
 *
 * Usage:
 *   node platform/scripts/fleet-observability-witness.mjs
 *   node platform/scripts/fleet-observability-witness.mjs --write
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECO = join(REPO_ROOT, '..');
const WRITE = process.argv.includes('--write');
const NAMESPACE = 'gtcx-staging';

const PILOT_DEPLOYMENTS = [
  { id: 'gtcx-agx-staging', owner: 'markets-os', pillar: 'ship', required: true },
  {
    id: 'markets-brokerage-protocol-trace',
    owner: 'markets-os',
    pillar: 'ship',
    required: true,
  },
  {
    id: 'markets-authority-stub-staging',
    owner: 'markets-os',
    pillar: 'ship',
    required: false,
    note: 'Optional stub — may scale to zero outside authority drills',
  },
  { id: 'sovereign-staging', owner: 'gtcx-os', pillar: 'surfaces', required: true },
  { id: 'gtcx-protocols-staging', owner: 'gtcx-os', pillar: 'surfaces', required: true },
  {
    id: 'did-resolver-staging',
    owner: 'gtcx-os',
    pillar: 'surfaces',
    required: false,
    note: 'Optional — scale-to-zero when DID path not in pilot slice',
  },
];

const ALERT_ROUTES = [
  {
    severity: 'critical',
    channel: 'PagerDuty → on-call phone',
    ackSla: '5 min',
    escalation: 'Auto-escalate to team lead after 15 min',
    doc: 'docs/architecture/specs/backend/observability-framework.md#alert-routing',
  },
  {
    severity: 'warning',
    channel: 'Slack #gtcx-alerts',
    ackSla: '30 min',
    escalation: 'Escalate to on-call after 2 hours',
    doc: 'docs/operations/runbooks/sre/monitoring.md',
  },
  {
    severity: 'pilot-ship-gate',
    channel: 'bridge-os pilot-readiness rollup',
    ackSla: 'weekly GT gates + staging smoke',
    escalation: 'pnpm ecosystem:pilot:readiness:report:write',
    doc: 'bridge-os/pm/ci/pilot-readiness-report-latest.json',
  },
];

function kubectl(args) {
  return spawnSync('kubectl', ['--request-timeout=25s', ...args], { encoding: 'utf8' });
}

function loadJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function probeDeployments() {
  const r = kubectl(['get', 'deploy', '-n', NAMESPACE, '-o', 'json']);
  if (r.status !== 0) {
    return {
      ok: false,
      error: r.stderr?.trim() || 'kubectl failed',
      deployments: [],
    };
  }
  const data = JSON.parse(r.stdout);
  const byName = new Map(
    (data.items ?? []).map((item) => [
      item.metadata.name,
      {
        ready: item.status?.readyReplicas ?? 0,
        desired: item.status?.replicas ?? item.spec?.replicas ?? 0,
        available: item.status?.availableReplicas ?? 0,
      },
    ]),
  );

  const deployments = PILOT_DEPLOYMENTS.map((row) => {
    const status = byName.get(row.id);
    const present = Boolean(status);
    const scaledDown = present && (status.desired ?? 0) === 0;
    const healthy =
      present &&
      (scaledDown
        ? row.required === false
        : status.desired > 0 && status.ready >= status.desired);
    return { ...row, present, scaledDown, healthy, ...status };
  });

  const requiredDeployments = deployments.filter((d) => d.required !== false);
  const markets = requiredDeployments.filter((d) => d.owner === 'markets-os');
  const gtcx = requiredDeployments.filter((d) => d.owner === 'gtcx-os');
  const marketsOk = markets.every((d) => d.present && d.healthy);
  const gtcxOk = gtcx.every((d) => d.present && d.healthy);

  return {
    ok: marketsOk && gtcxOk,
    namespace: NAMESPACE,
    marketsOk,
    gtcxOk,
    deployments,
  };
}

function readPilotGates() {
  const bridge = join(ECO, 'bridge-os/pm/ci/pilot-readiness-report-latest.json');
  const readiness = loadJson(bridge);
  const milestones = readiness?.milestones ?? [];
  const shipGates = milestones.filter((m) =>
    ['DEPLOY-STAGING', 'PROG-CONTINENTAL-GT', 'PROG-COMPLIANCE-DEPLOY'].includes(m.id),
  );

  const witnesses = {
    stagingSmoke: loadJson(join(REPO_ROOT, 'audit/evidence/pilot-staging-smoke-latest.json')),
    gtSubstrate: loadJson(join(REPO_ROOT, 'audit/evidence/pilot-golden-transaction-substrate-latest.json')),
    marketsGt: loadJson(join(ECO, 'markets-os/audit/evidence/pilot-golden-transaction-latest.json')),
    marketsStagingTrace: loadJson(
      join(ECO, 'markets-os/audit/evidence/golden-transaction-markets-staging-2026-06-12.json'),
    ),
  };

  const witnessOk = {
    stagingSmoke: witnesses.stagingSmoke?.ok === true,
    gtSubstrate: witnesses.gtSubstrate?.ok === true,
    marketsGt: witnesses.marketsGt?.ok === true,
    marketsStagingTrace: witnesses.marketsStagingTrace?.ok === true,
  };

  return {
    pilotShipReady: readiness?.pilotShipReady ?? null,
    shipGates,
    witnesses: witnessOk,
    witnessesFreshWithin7d: Object.fromEntries(
      Object.entries({
        stagingSmoke: witnesses.stagingSmoke?.generatedAt,
        gtSubstrate: witnesses.gtSubstrate?.generatedAt,
        marketsGt: witnesses.marketsGt?.at,
        marketsStagingTrace: witnesses.marketsStagingTrace?.probedAt,
      }).map(([k, ts]) => {
        if (!ts) return [k, false];
        const ageMs = Date.now() - new Date(ts).getTime();
        return [k, ageMs <= 7 * 24 * 60 * 60 * 1000];
      }),
    ),
  };
}

function main() {
  const cluster = probeDeployments();
  const pilotGates = readPilotGates();
  const witnessFresh = Object.values(pilotGates.witnessesFreshWithin7d).every(Boolean);
  const witnessOk = Object.values(pilotGates.witnesses).every(Boolean);

  const witness = {
    $schema: 'gtcx://fabric-os/fleet-observability/v1',
    storyId: 'Q3-FABRIC-04',
    programmeId: 'PROG-CONTINENTAL-CAPITAL',
    quarterPillarId: 'operational-ai',
    quarterId: 'GTCX-Q3-2026',
    generatedAt: new Date().toISOString(),
    repo: 'fabric-os',
    ok: cluster.ok && witnessOk && witnessFresh,
    namespace: NAMESPACE,
    dashboards: {
      ecosystemOverview: 'gtcx-infrastructure/monitoring/dashboards/ecosystem-overview.json',
      protocolHealth: 'gtcx-infrastructure/monitoring/dashboards/protocol-health.json',
      note: 'Grafana JSON models version-controlled in gtcx-infrastructure',
    },
    alertRoutes: ALERT_ROUTES,
    checks: {
      pilotNamespaces: cluster,
      pilotShipGates: pilotGates,
    },
    acceptance: {
      marketsOsNamespace: cluster.marketsOk,
      gtcxOsNamespace: cluster.gtcxOk,
      witnessPath: 'pm/ci/fleet-observability-latest.json',
      alertRoutesDocumented: true,
    },
  };

  console.log(`\n=== Fleet observability witness (Q3-FABRIC-04) ===`);
  console.log(`Namespace:        ${NAMESPACE}`);
  console.log(`Markets-os deploy: ${cluster.marketsOk ? 'PASS' : 'FAIL'}`);
  for (const d of cluster.deployments.filter((x) => x.owner === 'markets-os')) {
    const icon = d.healthy ? '✅' : d.present ? '⚠️' : '❌';
    const opt = d.required === false ? ' (opt)' : '';
    console.log(`  ${icon} ${d.id}${opt} ready=${d.ready ?? 0}/${d.desired ?? 0}`);
  }
  console.log(`gtcx-os deploy:    ${cluster.gtcxOk ? 'PASS' : 'FAIL'}`);
  for (const d of cluster.deployments.filter((x) => x.owner === 'gtcx-os')) {
    const icon = d.healthy ? '✅' : d.present ? '⚠️' : '❌';
    const opt = d.required === false ? ' (opt)' : '';
    console.log(`  ${icon} ${d.id}${opt} ready=${d.ready ?? 0}/${d.desired ?? 0}`);
  }
  console.log(`Pilot witnesses:   ${witnessOk ? 'PASS' : 'FAIL'}`);
  console.log(`Witness fresh 7d:  ${witnessFresh ? 'PASS' : 'FAIL'}`);
  console.log(`Overall:           ${witness.ok ? 'PASS' : 'FAIL'}\n`);

  if (WRITE) {
    const ciOut = join(REPO_ROOT, 'pm/ci/fleet-observability-latest.json');
    const auditOut = join(REPO_ROOT, 'audit/evidence/fleet-observability-latest.json');
    mkdirSync(dirname(ciOut), { recursive: true });
    mkdirSync(dirname(auditOut), { recursive: true });
    const body = `${JSON.stringify(witness, null, 2)}\n`;
    writeFileSync(ciOut, body);
    writeFileSync(auditOut, body);
    console.log(`[witness] ${ciOut}`);
    console.log(`[witness] ${auditOut}`);
  }

  process.exit(witness.ok ? 0 : 1);
}

main();
