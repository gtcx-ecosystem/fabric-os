#!/usr/bin/env node
/** SECAS-S5-03 — AI red-team fleet rollup (eval-pipeline + anomaly-detector) */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const EVAL = join(ROOT, 'platform/tools/eval-pipeline/eval.mjs');
const INJECTION = join(ROOT, 'platform/tools/eval-pipeline/injection-suite.mjs');
const ANOMALY = join(ROOT, 'platform/tools/anomaly-detector/detector.mjs');
const MODEL_CARD = join(ROOT, 'docs/governance/model-cards/anomaly-detector-model-card.md');
const STAGING_PATCH = join(ROOT, 'deploy/kubernetes/overlays/staging/anomaly-detector-patch.yaml');
const OUT = join(ROOT, 'audit/evidence/secas-ai-redteam-rollup-latest.json');
const WRITE = process.argv.includes('--write');

const gates = {
  evalPipeline: { ok: existsSync(EVAL) },
  injectionSuite: { ok: existsSync(INJECTION) },
  anomalyDetector: { ok: existsSync(ANOMALY) },
  modelCard: { ok: existsSync(MODEL_CARD) },
  stagingDeploy: { ok: existsSync(STAGING_PATCH) },
};
const ok = Object.values(gates).every((g) => g.ok);
const witness = {
  schema: 'gtcx://fabric-os/secas-ai-redteam-rollup/v1',
  storyId: 'SECAS-S5-03',
  checkedAt: new Date().toISOString(),
  gates,
  ok,
};
if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
for (const [k, v] of Object.entries(gates)) console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
console.log(`\n${ok ? 'PASS' : 'FAIL'} — SECAS AI red-team rollup`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
