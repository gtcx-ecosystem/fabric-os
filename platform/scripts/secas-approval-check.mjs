#!/usr/bin/env node
/**
 * P42 — Class S sovereign approval register gate (witness only — no signing).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER = join(ROOT, 'pm/sovereign-approval-register.json');
const OUT = join(ROOT, 'audit/evidence/secas-approval-check-latest.json');
const WRITE = process.argv.includes('--write');

if (!existsSync(REGISTER)) {
  console.error('missing sovereign-approval-register.json');
  process.exit(1);
}

const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
const pending = (reg.items ?? []).filter((i) => i.status === 'approval-needed');
const approved = (reg.items ?? []).filter((i) => i.status === 'approved');
const allBlocksIRFalse = (reg.items ?? []).every((i) => i.blocksIR === false);

const witness = {
  schema: 'gtcx://fabric-os/secas-approval-check/v1',
  protocol: 'P42-SECURITY-AS-A-SERVICE',
  checkedAt: new Date().toISOString(),
  approvalNeeded: pending.map((i) => ({ id: i.id, title: i.title, authorityClass: i.authorityClass })),
  approved: approved.map((i) => ({ id: i.id, approvedAt: i.approvedAt })),
  blocksIRPolicy: allBlocksIRFalse,
  ok: allBlocksIRFalse,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

console.log(`Approval needed: ${pending.length}`);
for (const p of pending) console.log(`  - ${p.id}: ${p.title} (Class ${p.authorityClass})`);
console.log(`Approved: ${approved.length}`);
console.log(`blocksIR false policy: ${allBlocksIRFalse ? 'OK' : 'FAIL'}`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(allBlocksIRFalse ? 0 : 1);
