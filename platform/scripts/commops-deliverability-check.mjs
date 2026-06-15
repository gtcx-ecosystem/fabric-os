#!/usr/bin/env node
/**
 * CommOps deliverability substrate witness (fabric-os).
 * Usage: node commops-deliverability-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SUBSTRATE = join(ROOT, 'pm/commops-substrate-contract.json');
const OUT = join(ROOT, 'audit/evidence/commops-deliverability-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

let channels = [];
let deliverability = {};
if (existsSync(SUBSTRATE)) {
  const sub = JSON.parse(readFileSync(SUBSTRATE, 'utf8'));
  channels = sub.channels ?? [];
  deliverability = sub.deliverability ?? {};
}

const gates = {
  substrate: { ok: existsSync(SUBSTRATE) },
  channelCount: { ok: channels.length >= 3, count: channels.length },
  dkimRequired: { ok: deliverability.dkimRequired === true },
  spfRequired: { ok: deliverability.spfRequired === true },
  bounceIngressDeclared: { ok: Boolean(deliverability.bounceWebhookIngress) },
};

const ok = Object.values(gates).every((g) => g.ok);

const witness = {
  $schema: 'gtcx://fabric-os/commops-deliverability/v1',
  updated: new Date().toISOString(),
  repo: 'fabric-os',
  lane: 'CommOps',
  channels: channels.map((c) => ({ id: c.id, provider: c.provider, status: c.status })),
  gates,
  ok,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  console.log('=== CommOps deliverability ===\n');
  for (const [k, v] of Object.entries(gates)) {
    console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
  }
  console.log(`\n${ok ? 'PASS' : 'FAIL'}`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(ok ? 0 : 1);
