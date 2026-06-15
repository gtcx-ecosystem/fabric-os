#!/usr/bin/env node
/** SECAS-S5-02 — product-line threat model index gate */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/evidence/secas-product-threat-latest.json');
const RISK_WITNESS = join(ROOT, 'audit/evidence/fleet-risk-check-latest.json');
const WRITE = process.argv.includes('--write');

const riskRun = spawnSync('node', ['platform/scripts/fleet-risk-check.mjs', '--write'], {
  cwd: ROOT,
  encoding: 'utf8',
});
let witnessData = null;
if (existsSync(RISK_WITNESS)) {
  witnessData = JSON.parse(readFileSync(RISK_WITNESS, 'utf8'));
}
const productOk = witnessData?.gates?.productThreatModels?.ok === true;
const gates = {
  fleetRiskHarness: { ok: riskRun.status === 0, exit: riskRun.status ?? 1 },
  productThreatModels: { ok: productOk, probe: witnessData?.gates?.productThreatModels?.probe ?? {} },
};
const ok = gates.fleetRiskHarness.ok && gates.productThreatModels.ok;
const witness = {
  schema: 'gtcx://fabric-os/secas-product-threat/v1',
  storyId: 'SECAS-S5-02',
  checkedAt: new Date().toISOString(),
  gates,
  ok,
};
if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
for (const [k, v] of Object.entries(gates)) console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
console.log(`\n${ok ? 'PASS' : 'FAIL'} — SECAS product threat models`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
