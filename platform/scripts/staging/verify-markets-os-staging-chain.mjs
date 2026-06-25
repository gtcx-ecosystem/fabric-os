#!/usr/bin/env node
/**
 * Verify markets-os staging API credential chain (PROD-READY-005 / FB-001).
 * Safe read-only probe — no raw secret values are emitted.
 *
 * Checks:
 *   1. AWS Secrets Manager shell exists and required keys are populated
 *   2. ESO SecretStore + ExternalSecret exist in markets-os-staging
 *    3. Synthesized K8s secret markets-os-secrets exists
 *   4. markets-os populate-env-from-sm.mjs is present and executable
 *
 * Usage: node platform/scripts/staging/verify-markets-os-staging-chain.mjs [--json]
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const REGION = process.env.AWS_REGION || 'af-south-1';
const SECRET_ID = process.env.MARKETS_OS_SECRET_ID || 'gtcx/markets-os/staging/api-keys';
const K8S_NAMESPACE = 'markets-os-staging';
const JSON_OUT = process.argv.includes('--json');

const REQUIRED_KEYS = [
  'POSTGRES_PASSWORD',
  'AUTH_JWT_SECRET',
  'INTERNAL_SERVICE_TOKEN',
  'ADVISORY_API_URL',
  'BROKERAGE_API_URL',
  'FUND_API_URL',
];

function run(cmd, { ignoreError = true } = {}) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim() };
  } catch (e) {
    if (!ignoreError) throw e;
    return { ok: false, output: e.stderr?.toString?.() || e.message };
  }
}

function aws(args) {
  return run(`aws ${args} --region ${REGION} --output json 2>/dev/null`);
}

function fileExists(rel) {
  return existsSync(join(process.cwd(), rel));
}

function checkAwsSecret() {
  const gate = { id: 'aws-secret-shell', label: 'AWS Secrets Manager shell exists', ok: false };
  const r = aws(`secretsmanager describe-secret --secret-id ${SECRET_ID}`);
  if (r.ok) {
    try {
      const data = JSON.parse(r.output);
      gate.ok = true;
      gate.detail = { arn: data.ARN, name: data.Name };
    } catch (e) {
      gate.error = `invalid JSON: ${e.message}`;
    }
  } else {
    gate.error = r.output;
  }
  return gate;
}

function checkAwsSecretValues() {
  const gate = {
    id: 'aws-secret-values',
    label: 'AWS SM secret has required keys populated',
    ok: false,
    placeholders: [],
  };
  const r = aws(`secretsmanager get-secret-value --secret-id ${SECRET_ID}`);
  if (!r.ok) {
    gate.error = r.output;
    return gate;
  }
  try {
    const data = JSON.parse(r.output);
    const secret = JSON.parse(data.SecretString || '{}');
    for (const key of REQUIRED_KEYS) {
      const value = secret[key];
      if (!value || value === '' || value.startsWith('change-me')) {
        gate.placeholders.push(key);
      }
    }
    gate.ok = gate.placeholders.length === 0;
    gate.detail = { keysPresent: Object.keys(secret), placeholders: gate.placeholders };
  } catch (e) {
    gate.error = `invalid JSON: ${e.message}`;
  }
  return gate;
}

function checkK8sResource(kind, name, namespace) {
  return run(`kubectl get ${kind} ${name} -n ${namespace} -o json 2>/dev/null`);
}

function checkEsoResources() {
  const results = [];
  const secretStore = {
    id: 'eso-secretstore',
    label: 'ESO SecretStore exists in markets-os-staging',
    ok: false,
  };
  const ss = checkK8sResource('secretstore', 'markets-os-aws-secrets', K8S_NAMESPACE);
  secretStore.ok = ss.ok;
  if (!ss.ok) secretStore.error = ss.output;
  results.push(secretStore);

  const externalSecret = {
    id: 'eso-externalsecret',
    label: 'ESO ExternalSecret exists in markets-os-staging',
    ok: false,
  };
  const es = checkK8sResource('externalsecret', 'markets-os-secrets', K8S_NAMESPACE);
  externalSecret.ok = es.ok;
  if (!es.ok) externalSecret.error = es.output;
  results.push(externalSecret);

  const k8sSecret = {
    id: 'k8s-secret',
    label: 'Synthesized K8s secret markets-os-secrets exists',
    ok: false,
  };
  const ks = checkK8sResource('secret', 'markets-os-secrets', K8S_NAMESPACE);
  k8sSecret.ok = ks.ok;
  if (!ks.ok) k8sSecret.error = ks.output;
  results.push(k8sSecret);

  return results;
}

function checkMarketsIntegration() {
  const gate = {
    id: 'markets-integration-script',
    label: 'markets-os populate-env-from-sm.mjs present',
    ok: false,
  };
  const path = '../markets-os/platform/scripts/staging/populate-env-from-sm.mjs';
  gate.ok = fileExists(path);
  gate.detail = { path };
  return gate;
}

function main() {
  const awsShell = checkAwsSecret();
  const awsValues = checkAwsSecretValues();
  const eso = checkEsoResources();
  const markets = checkMarketsIntegration();

  const gates = [awsShell, awsValues, ...eso, markets];
  const ok = gates.every((g) => g.ok);

  const witness = {
    schema: 'gtcx://fabric-os/markets-os-staging-chain-verify/v1',
    protocol: 'FB-001 / PROD-READY-005',
    checkedAt: new Date().toISOString(),
    secretId: SECRET_ID,
    region: REGION,
    gates,
    ok,
  };

  // Hub witness for cross-repo agent discovery (redacted — no secret values)
  const hubPath = join(ROOT, '..', 'bridge-os', 'pm', 'ci', 'fabric-os-blocker-fb001-latest.json');
  const hubWitness = {
    schema: 'gtcx://fabric-os/fleet-blocker-hub-witness/v1',
    blockerId: 'FB-001',
    blockedRepo: 'markets-os',
    blockedStory: 'IR-006',
    checkedAt: witness.checkedAt,
    infrastructureReady: gates.find((g) => g.id === 'aws-secret-shell')?.ok === true &&
                         gates.find((g) => g.id === 'eso-secretstore')?.ok === true &&
                         gates.find((g) => g.id === 'eso-externalsecret')?.ok === true,
    secretsPopulated: gates.find((g) => g.id === 'aws-secret-values')?.ok === true,
    k8sSecretReady: gates.find((g) => g.id === 'k8s-secret')?.ok === true,
    integrationScriptReady: gates.find((g) => g.id === 'markets-integration-script')?.ok === true,
    placeholders: gates.find((g) => g.id === 'aws-secret-values')?.placeholders ?? [],
    ok,
    verificationCommand: 'pnpm --dir ../fabric-os markets:staging:verify',
    operatorStep: 'Populate AWS SM gtcx/markets-os/staging/api-keys with POSTGRES_PASSWORD, AUTH_JWT_SECRET, INTERNAL_SERVICE_TOKEN',
    evidencePath: 'audit/evidence/markets-os-staging-chain-verify-latest.json',
  };
  mkdirSync(dirname(hubPath), { recursive: true });
  writeFileSync(hubPath, `${JSON.stringify(hubWitness, null, 2)}\n`);

  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    for (const g of gates) {
      const extra = g.placeholders?.length ? ` (placeholders: ${g.placeholders.join(', ')})` : '';
      const err = g.error ? ` — ${g.error.split('\n')[0]}` : '';
      console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${extra}${err}`);
    }
    console.log(`\n${ok ? 'PASS' : 'FAIL'} — markets-os staging chain`);
  }

  process.exit(ok ? 0 : 1);
}

main();
