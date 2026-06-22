#!/usr/bin/env node
/**
 * CommOps substrate readiness — SM populate script, handoff, pilot ESO cutover.
 * Usage: node commops-substrate-readiness.mjs [--write]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECO = join(ROOT, '..');
const SUBSTRATE = join(ROOT, 'machine/commops-substrate-contract.json');
const POPULATE = join(ROOT, 'platform/scripts/staging/populate-commops-staging-sm.sh');
const HANDOFF = join(
  ROOT,
  'docs/operations/coordination/inbound/to-b/to-commops-fleet-substrate-migration-2026-06-17.md',
);
const TERRA_ESO = join(ECO, 'terra-os/deploy/infra/k8s/external-secrets/terraos-secrets-staging.yaml');
const FABRIC_TERRA_SENDGRID = join(
  ROOT,
  'deploy/kubernetes/overlays/staging/terra-os/external-secret-commops-sendgrid.yaml',
);
const OUT = join(ROOT, 'audit/evidence/commops-substrate-readiness-latest.json');
const WRITE = process.argv.includes('--write');

function awsSecretExists(secretId) {
  const r = spawnSync(
    'aws',
    ['secretsmanager', 'describe-secret', '--secret-id', secretId, '--region', 'af-south-1'],
    { encoding: 'utf8' },
  );
  return r.status === 0;
}

function dryRunPopulate() {
  const r = spawnSync('bash', [POPULATE], { cwd: ROOT, encoding: 'utf8' });
  return { ok: (r.status ?? 1) === 0, exitCode: r.status ?? 1 };
}

const gates = {
  substrateContract: { ok: existsSync(SUBSTRATE) },
  populateScript: { ok: existsSync(POPULATE) },
  populateDryRun: { ok: false },
  fleetHandoff: { ok: existsSync(HANDOFF) },
  terraPilotEso: { ok: false },
  fabricTerraSendgridEso: { ok: existsSync(FABRIC_TERRA_SENDGRID) },
  smSendgridStaging: { ok: false, advisory: true },
  smAfricasTalkingStaging: { ok: false, advisory: true },
  smTwilioStaging: { ok: false, advisory: true },
};

gates.populateDryRun = dryRunPopulate();

if (existsSync(TERRA_ESO)) {
  const body = readFileSync(TERRA_ESO, 'utf8');
  gates.terraPilotEso = {
    ok:
      body.includes('gtcx/shared/staging/commops/sendgrid') &&
      body.includes('gtcx/shared/staging/commops/africas-talking'),
    path: 'terra-os/deploy/infra/k8s/external-secrets/terraos-secrets-staging.yaml',
  };
}

if (existsSync(SUBSTRATE)) {
  const sub = JSON.parse(readFileSync(SUBSTRATE, 'utf8'));
  for (const ch of sub.channels ?? []) {
    if (ch.stagingSm === 'gtcx/shared/staging/commops/sendgrid') {
      gates.smSendgridStaging = { ok: awsSecretExists(ch.stagingSm), path: ch.stagingSm, advisory: true };
    }
    if (ch.stagingSm === 'gtcx/shared/staging/commops/africas-talking') {
      gates.smAfricasTalkingStaging = {
        ok: awsSecretExists(ch.stagingSm),
        path: ch.stagingSm,
        advisory: true,
      };
    }
    if (ch.stagingSm === 'gtcx/shared/staging/commops/twilio') {
      gates.smTwilioStaging = { ok: awsSecretExists(ch.stagingSm), path: ch.stagingSm, advisory: true };
    }
  }
}

const ok =
  gates.substrateContract.ok &&
  gates.populateScript.ok &&
  gates.populateDryRun.ok &&
  gates.fleetHandoff.ok &&
  gates.terraPilotEso.ok &&
  gates.fabricTerraSendgridEso.ok;

const witness = {
  schema: 'gtcx://fabric-os/commops-substrate-readiness/v1',
  checkedAt: new Date().toISOString(),
  opsLane: 'CommOps',
  gates,
  ok,
  note: 'SM existence advisory until Class A populate --apply',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const [k, v] of Object.entries(gates)) {
  const tag = v.advisory && !v.ok ? 'ADVISORY' : v.ok ? 'OK' : 'FAIL';
  const extra = v.path ? ` (${v.path})` : v.exitCode != null ? ` (exit ${v.exitCode})` : '';
  console.log(`${tag} ${k}${extra}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — CommOps substrate readiness`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
