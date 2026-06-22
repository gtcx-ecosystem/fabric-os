#!/usr/bin/env node
/** SECAS-S5-05 — bug bounty operationalization gate */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OPS = join(ROOT, 'machine/spec/bug-bounty-ops.json');
const POLICY = join(ROOT, 'operations/security/narrative/bug-bounty-policy.md');
const TRIAGE = join(ROOT, 'docs/operations/secas/runbooks/bug-bounty-triage.md');
const OUT = join(ROOT, 'audit/evidence/secas-bounty-ops-latest.json');
const WRITE = process.argv.includes('--write');

const ops = existsSync(OPS) ? JSON.parse(readFileSync(OPS, 'utf8')) : null;
const policyText = existsSync(POLICY) ? readFileSync(POLICY, 'utf8') : '';
const gates = {
  opsSpec: { ok: ops?.storyId === 'SECAS-S5-05' },
  policyDoc: { ok: policyText.length > 200 && !/Link stub/i.test(policyText) },
  triageRunbook: { ok: existsSync(TRIAGE) },
  safeHarbor: { ok: ops?.safeHarbor === true },
};
const ok = Object.values(gates).every((g) => g.ok);
const witness = {
  schema: 'gtcx://fabric-os/secas-bounty-ops/v1',
  storyId: 'SECAS-S5-05',
  checkedAt: new Date().toISOString(),
  gates,
  ok,
};
if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
for (const [k, v] of Object.entries(gates)) console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
console.log(`\n${ok ? 'PASS' : 'FAIL'} — SECAS bug bounty ops`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
