#!/usr/bin/env node
/**
 * Q3-FABRIC-01 — DaaS pilot staging smoke witness.
 * Combines fleet health probes + gtcx-os documentation matrix + staging ingress checks.
 *
 * Usage:
 *   node platform/scripts/pilot-staging-smoke.mjs
 *   node platform/scripts/pilot-staging-smoke.mjs --write
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECO = join(REPO_ROOT, '..');
const WRITE = process.argv.includes('--write');
const ua = process.env.GTCX_PROBE_UA ?? 'Mozilla/5.0 (GTCX pilot-staging-smoke)';

const STAGING_INGRESS = [
  { id: 'markets-agx', owner: 'markets-os', url: 'https://api.staging.gtcx.trade/api/health', pillar: 'ship' },
  { id: 'gtcx-sovereign', owner: 'gtcx-os', url: 'https://sovereign-staging.gtcx.trade/api/health', pillar: 'surfaces' },
  { id: 'gtcx-intelligence', owner: 'gtcx-os', url: 'https://intelligence-staging.gtcx.trade/health', pillar: 'surfaces' },
];

async function probe(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(20000) });
    return { url, status: res.status, ok: res.status === 200, latencyMs: Date.now() - start, error: null };
  } catch (err) {
    return { url, status: 0, ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

function readDocMatrix() {
  const path = join(ECO, 'gtcx-os/pm/ci/documentation-matrix-latest.json');
  try {
    const raw = readFileSync(path, 'utf8');
    const j = JSON.parse(raw);
    const surfaces = j.surfaces ?? [];
    return {
      path,
      ok: j.ok === true,
      surfaceCount: surfaces.length,
      surfacesOk: surfaces.filter((s) => s.ok).length,
      surfaces,
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function runFleetHealth() {
  const r = spawnSync('node', ['platform/tools/scripts/cross-repo-health-probe.mjs'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, OUTPUT_DIR: 'audit/evidence/cross-repo-health' },
  });
  let parsed = null;
  try {
    const p = join(REPO_ROOT, 'audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json');
    parsed = JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    parsed = null;
  }
  return { exitCode: r.status ?? 1, report: parsed };
}

async function main() {
  const fleet = runFleetHealth();
  const ingress = await Promise.all(
    STAGING_INGRESS.map(async (row) => ({ ...row, probe: await probe(row.url) })),
  );
  const docMatrix = readDocMatrix();

  const ingressRequiredOk = ingress.filter((r) => r.probe.ok).length;
  const ingressPass = ingressRequiredOk === ingress.length;
  const fleetPass = fleet.exitCode === 0;
  const surfacesPass = docMatrix.ok && docMatrix.surfacesOk === docMatrix.surfaceCount;

  const witness = {
    $schema: 'gtcx://fabric-os/pilot-staging-smoke/v1',
    storyId: 'Q3-FABRIC-01',
    programmeId: 'PROG-CONTINENTAL-CAPITAL',
    quarterPillarId: 'ship',
    quarterId: 'GTCX-Q3-2026',
    generatedAt: new Date().toISOString(),
    repo: 'fabric-os',
    ok: fleetPass && ingressPass && surfacesPass,
    checks: {
      fleetHealth: { ok: fleetPass, exitCode: fleet.exitCode, summary: fleet.report?.summary ?? null },
      stagingIngress: { ok: ingressPass, probes: ingress },
      gtcxDocumentationMatrix: docMatrix,
    },
    acceptance: {
      marketsPilotHealth: ingress.find((r) => r.id === 'markets-agx')?.probe?.ok ?? false,
      gtcxSurfacesMatrix: surfacesPass,
      witnessPath: 'audit/evidence/pilot-staging-smoke-latest.json',
    },
  };

  console.log(`\n=== Pilot staging smoke (Q3-FABRIC-01) ===`);
  console.log(`Fleet health:     ${fleetPass ? 'PASS' : 'FAIL'} (exit ${fleet.exitCode})`);
  console.log(`Staging ingress:  ${ingressPass ? 'PASS' : 'PARTIAL'} (${ingressRequiredOk}/${ingress.length})`);
  for (const row of ingress) {
    const icon = row.probe.ok ? '✅' : '❌';
    console.log(`  ${icon} ${row.id} ${row.probe.status} ${row.url}`);
  }
  console.log(
    `GT CX surfaces:   ${surfacesPass ? 'PASS' : 'FAIL'} (${docMatrix.surfacesOk ?? 0}/${docMatrix.surfaceCount ?? 0})`,
  );
  console.log(`Overall:          ${witness.ok ? 'PASS' : 'FAIL'}\n`);

  if (WRITE) {
    const out = join(REPO_ROOT, 'audit/evidence/pilot-staging-smoke-latest.json');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(witness, null, 2)}\n`);
    console.log(`[witness] ${out}`);
  }

  process.exit(witness.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
