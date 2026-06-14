#!/usr/bin/env node
/**
 * PayOps — fleet payment provider inventory + friction register gate.
 * Usage: node payops-providers-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const ECOSYSTEM = join(ROOT, '..');
const REGISTER = join(ROOT, 'pm/payops-friction-register.json');
const DOMAIN_REGISTRY = join(BRIDGE, 'pm/spec/payops-domain-registry.json');
const OPS = join(ROOT, 'docs/operations/payops-as-a-service.md');
const OUT = join(ROOT, 'audit/evidence/payops-fleet-inventory-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

/** Forensic SoR — stripe/flutterwave live consumers (2026-06-14 audit). */
const STRIPE_INDICATORS = [
  { repo: 'terminal-os', paths: ['platform/web/lib/stripe', 'app/api/stripe'] },
  { repo: 'sensei-os', paths: ['platform/apps/api/src/services/stripe.ts'] },
  { repo: 'nyota-ai', paths: ['services/stripe_billing.py'] },
  { repo: 'compliance-os', paths: ['platform/services/caas/src/lib/billing.ts'] },
];
const FLUTTERWAVE_INDICATORS = [
  { repo: 'griot-ai', paths: ['platform/src/api/routes/billing.ts', 'billing/flutterwave.js'] },
];

function repoRoot(repo) {
  return join(ECOSYSTEM, repo);
}

function anyPathExists(base, relPaths) {
  return relPaths.some((p) => existsSync(join(base, p)));
}

function scanConsumers(indicators, provider) {
  return indicators.map(({ repo, paths }) => {
    const base = repoRoot(repo);
    const present = existsSync(base) && anyPathExists(base, paths);
    return { repo, provider, present, paths };
  });
}

function main() {
  const gates = {};
  gates.register = { ok: existsSync(REGISTER) };
  gates.domainRegistry = { ok: existsSync(DOMAIN_REGISTRY) };
  gates.opsDoc = { ok: existsSync(OPS) };

  const stripeConsumers = scanConsumers(STRIPE_INDICATORS, 'stripe');
  const flutterwaveConsumers = scanConsumers(FLUTTERWAVE_INDICATORS, 'flutterwave');
  const stripeLive = stripeConsumers.filter((c) => c.present);
  const flutterwaveLive = flutterwaveConsumers.filter((c) => c.present);

  gates.stripeDuplication = {
    ok: stripeLive.length <= 1,
    count: stripeLive.length,
    repos: stripeLive.map((c) => c.repo),
    note: 'Target: fabric PayOps substrate — until then expect >1',
  };

  let openP0 = 0;
  if (existsSync(REGISTER)) {
    const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
    const open = (reg.items ?? []).filter((i) => i.priority === 'P0' && i.status === 'open');
    openP0 = open.length;
    gates.openP0 = { ok: true, count: openP0, ids: open.map((i) => i.id) };
  } else {
    gates.openP0 = { ok: false, count: 0 };
  }

  const structuralOk = gates.register.ok && gates.domainRegistry.ok && gates.opsDoc.ok;

  const witness = {
    schema: 'gtcx://fabric-os/payops-fleet-inventory/v1',
    opsLane: 'PayOps',
    checkedAt: new Date().toISOString(),
    owner: 'fabric-os',
    gates,
    inventory: {
      stripeConsumers: stripeLive,
      flutterwaveConsumers: flutterwaveLive,
      substrateStatus: 'planned',
    },
    openP0,
    ok: structuralOk,
  };

  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
  else {
    for (const [k, v] of Object.entries(gates)) {
      const extra =
        v.count != null ? ` (${v.count})` : v.repos ? ` [${v.repos.join(', ')}]` : '';
      console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${extra}`);
    }
    console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — PayOps structural gates`);
    if (WRITE) console.log(`witness: ${OUT}`);
  }
  process.exit(structuralOk ? 0 : 1);
}

main();
