#!/usr/bin/env node
/**
 * MOF-002 — intelligence-staging cost-router pod import probe (fabric-os).
 * Verifies ENABLE_COST_ROUTER health flag AND runtime baselineos/cost-router in pod.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
const REPO_ROOT = process.cwd();
const STAGING_URL = process.env.INTELLIGENCE_STAGING_URL ?? 'https://intelligence-staging.gtcx.trade';
const NAMESPACE = process.env.INTELLIGENCE_NAMESPACE ?? 'intelligence';
const DEPLOYMENT = process.env.INTELLIGENCE_DEPLOYMENT ?? 'intelligence-orchestrator';

function parseArgs(argv) {
  const args = { write: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--write') args.write = true;
  }
  return args;
}

function curlHealth() {
  try {
    const out = execFileSync('curl', ['-sS', '-m', '20', `${STAGING_URL}/health`], {
      encoding: 'utf8',
    });
    return { ok: true, body: JSON.parse(out) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function kubectlPodImport() {
  const script = `
try {
  const m = require('baselineos/cost-router');
  const d = m.routeInferenceRequest({ prompt: 'mof-002 probe', complexityHint: 'simple' });
  console.log(JSON.stringify({ ok: true, provider: d.provider, model: d.model }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: e.message }));
  process.exit(1);
}
`.trim();
  const r = spawnSync(
    'kubectl',
    ['exec', '-n', NAMESPACE, `deploy/${DEPLOYMENT}`, '--', 'node', '-e', script],
    { encoding: 'utf8', timeout: 120_000 },
  );
  if (r.error) {
    return { ok: false, error: r.error.message, stderr: r.stderr };
  }
  try {
    const parsed = JSON.parse(r.stdout.trim().split('\n').pop());
    return { ...parsed, stderr: r.stderr || undefined };
  } catch {
    return { ok: false, error: r.stdout || r.stderr || 'kubectl exec parse failed' };
  }
}

export function runProbe() {
  const health = curlHealth();
  const enableCostRouter = health.body?.features?.enableCostRouter === true;
  const podImport = kubectlPodImport();
  const overall =
    health.ok && enableCostRouter && podImport.ok === true ? 'PASS' : 'FAIL';
  const witness = {
    $schema: 'gtcx://fabric-os/mlops-cost-router-staging-probe/v1',
    version: '1.0.0',
    updated: new Date().toISOString(),
    storyId: 'MOF-002',
    stagingUrl: STAGING_URL,
    overall,
    health: {
      ok: health.ok,
      enableCostRouter,
      status: health.body?.status,
      imageNote: 'health flag alone insufficient — pod must import baselineos/cost-router',
    },
    podImport,
    deployment: {
      namespace: NAMESPACE,
      name: DEPLOYMENT,
      manifest: 'deploy/kubernetes/overlays/staging/intelligence/deployment.yaml',
    },
    remediation: {
      owner: 'bridge-os-intelligence-bridge',
      steps: [
        'node 03-platform/scripts/prepare-baseline-os-for-ci.mjs',
        'node 03-platform/tools/verify-cost-router-v1.1-consume.mjs',
        'docker build -f 03-platform/intelligence/sdk/Dockerfile .',
        'push to ECR gtcx-intelligence-sdk — update fabric deployment image tag',
        'kubectl rollout status deployment/intelligence-orchestrator -n intelligence',
      ],
    },
    errors: [],
  };
  if (!health.ok) witness.errors.push(`health probe failed: ${health.error}`);
  if (!enableCostRouter) witness.errors.push('features.enableCostRouter !== true');
  if (!podImport.ok) witness.errors.push(`pod import failed: ${podImport.error ?? 'unknown'}`);
  return witness;
}

if (isMain) {
  const args = parseArgs(process.argv);
  const witness = runProbe();
  const out = join(REPO_ROOT, 'audit/evidence/mlops-cost-router-staging-probe-latest.json');
  if (args.write) {
    writeFileSync(out, `${JSON.stringify(witness, null, 2)}\n`);
    console.log(`mlops:cost-router-staging-probe → ${out} (${witness.overall})`);
  } else {
    console.log(JSON.stringify(witness, null, 2));
  }
  process.exit(witness.overall === 'PASS' ? 0 : 1);
}
