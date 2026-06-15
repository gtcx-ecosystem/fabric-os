#!/usr/bin/env node
/** SECAS-S5-01 — quarterly purple-team cadence witness */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const POLICY = join(ROOT, 'pm/spec/purple-team-cadence.json');
const RUNBOOK = join(ROOT, 'docs/operations/secas/runbooks/purple-team-cadence.md');
const OUT = join(ROOT, 'audit/evidence/secas-purple-team-latest.json');
const WRITE = process.argv.includes('--write');

const policy = existsSync(POLICY) ? JSON.parse(readFileSync(POLICY, 'utf8')) : null;
const gates = {
  policy: { ok: policy?.storyId === 'SECAS-S5-01' && policy?.cadence === 'quarterly' },
  runbook: { ok: existsSync(RUNBOOK) },
  nextWindow: { ok: Boolean(policy?.nextWindow) },
};
const ok = Object.values(gates).every((g) => g.ok);
const witness = { schema: 'gtcx://fabric-os/secas-purple-team/v1', checkedAt: new Date().toISOString(), gates, ok };
if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
for (const [k, v] of Object.entries(gates)) console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
console.log(`\n${ok ? 'PASS' : 'FAIL'} — SECAS purple-team cadence`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
