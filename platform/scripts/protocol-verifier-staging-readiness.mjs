#!/usr/bin/env node
/**
 * XR-MKT-PROTOCOL-NATIVE-001 — staging verifier readiness witness.
 * Usage: node platform/scripts/protocol-verifier-staging-readiness.mjs [--write]
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/evidence/protocol-verifier-staging-readiness-2026-06-12.json');
const WRITE = process.argv.includes('--write');
const NAMESPACE = 'gtcx-staging';
const DEPLOY = 'gtcx-protocols-staging';
const SECRET = 'gtcx-manifest-verifier-staging';
const MARKETS_SIGNER_SECRET = 'gtcx-markets-manifest-signer-staging';

function kubectl(args) {
  return spawnSync('kubectl', ['--request-timeout=20s', ...args], { encoding: 'utf8' });
}

function configGate() {
  const r = spawnSync('pnpm', ['check:protocol-verifier-staging-contract'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return { ok: r.status === 0, exitCode: r.status ?? 1 };
}

const secretGet = kubectl(['get', 'secret', SECRET, '-n', NAMESPACE]);
const secretExists = secretGet.status === 0;
const marketsSignerGet = kubectl(['get', 'secret', MARKETS_SIGNER_SECRET, '-n', NAMESPACE]);
const marketsSignerExists = marketsSignerGet.status === 0;

const deployGet = kubectl([
  'get',
  'deploy',
  DEPLOY,
  '-n',
  NAMESPACE,
  '-o',
  'jsonpath={.spec.template.spec.containers[0].image}',
]);
const image = deployGet.stdout?.trim() || null;

const podList = kubectl(['get', 'pods', '-n', NAMESPACE, '-l', 'app=gtcx-protocols', '-o', 'jsonpath={.items[0].metadata.name}']);
const pod = podList.stdout?.trim() || null;

let readyProbe = { ok: false, body: null, note: 'no pod' };
if (pod) {
  const exec = kubectl(['exec', '-n', NAMESPACE, pod, '--', 'wget', '-qO-', 'http://127.0.0.1:8300/ready']);
  readyProbe = {
    ok: exec.status === 0,
    body: exec.stdout?.trim() || null,
    stderr: exec.stderr?.trim()?.slice(0, 200) || null,
  };
}

const config = configGate();
const pnv2ImageRequired = 'e7525dfa';
const imageHasPnv2 = image?.includes('e7525dfa') || false;

const witness = {
  schema: 'gtcx://fabric-os/protocol-verifier-staging-readiness/v1',
  id: 'PROTOCOL-VERIFIER-STAGING-READINESS-2026-06-12',
  ticket: 'XR-MKT-PROTOCOL-NATIVE-001',
  checkedAt: new Date().toISOString(),
  namespace: NAMESPACE,
  deployment: DEPLOY,
  secret: { name: SECRET, exists: secretExists },
  marketsSignerSecret: { name: MARKETS_SIGNER_SECRET, exists: marketsSignerExists },
  image,
  pnv2: { requiredCommit: pnv2ImageRequired, imageContainsCommit: imageHasPnv2 },
  configGate: config,
  readyEndpoint: readyProbe,
  blockers: [
    !secretExists && 'populate gtcx-manifest-verifier-staging (Class A)',
    !marketsSignerExists && 'populate gtcx-markets-manifest-signer-staging',
    !imageHasPnv2 && `deploy image containing ${pnv2ImageRequired}`,
    imageHasPnv2 && 'markets-os ESO sync + brokerage staging deploy for GT trace',
    imageHasPnv2 && 'live Golden Transaction trace pack',
  ].filter(Boolean),
  ok: secretExists && marketsSignerExists && imageHasPnv2 && config.ok,
  repo: 'fabric-os',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

console.log(`secret ${SECRET}: ${secretExists ? 'EXISTS' : 'MISSING'}`);
console.log(`markets signer ${MARKETS_SIGNER_SECRET}: ${marketsSignerExists ? 'EXISTS' : 'MISSING'}`);
console.log(`image: ${image ?? 'unknown'}`);
console.log(`config gate: ${config.ok ? 'PASS' : 'FAIL'}`);
console.log(`/ready: ${readyProbe.body ?? readyProbe.note}`);
console.log(`${witness.ok ? 'PASS' : 'BLOCKED'} — protocol verifier staging readiness`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(witness.ok ? 0 : 1);
