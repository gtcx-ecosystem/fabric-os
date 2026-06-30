#!/usr/bin/env node
/**
 * Redacted readiness check for the fleet CI npm read token.
 *
 * System of record is the bridge-os/Baseline vault (Protocol 19). The token
 * value is never printed or written. AWS Secrets Manager may be used later as
 * a runner projection target, but it is not the source of truth.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/evidence/ci-npm-token-readiness-latest.json');
const HANDOFF = join(
  ROOT,
  'docs/operations/coordination/inbound/from-ledger-ui-npm-token-2026-06-30.md',
);
const BASELINE_CLI = join(ROOT, '../baseline-os/platform/packages/baselineos/dist/cli/bin.js');
const BRIDGE_OS = join(ROOT, '../bridge-os');

const DEFAULT_CREDENTIAL = 'NPM_TOKEN';
const DEFAULT_AGENT_ID = 'fabric-os-ci-readiness';
const DEFAULT_TRUST_SCORE = '100';

const args = process.argv.slice(2);
const opts = {
  credential: DEFAULT_CREDENTIAL,
  agentId: DEFAULT_AGENT_ID,
  trustScore: DEFAULT_TRUST_SCORE,
  write: false,
  json: false,
  execute: false,
};

for (const arg of args) {
  if (arg === '--') continue;
  else if (arg === '--write') opts.write = true;
  else if (arg === '--json') opts.json = true;
  else if (arg === '--execute') opts.execute = true;
  else if (arg.startsWith('--credential=')) opts.credential = arg.slice('--credential='.length);
  else if (arg.startsWith('--agent-id=')) opts.agentId = arg.slice('--agent-id='.length);
  else if (arg.startsWith('--trust-score=')) opts.trustScore = arg.slice('--trust-score='.length);
  else {
    console.error(`Unknown argument: ${arg}`);
    process.exit(2);
  }
}

function run(command, argsList, options = {}) {
  const result = spawnSync(command, argsList, {
    cwd: options.cwd || ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function sanitizeError(text) {
  return String(text || '')
    .replace(/npm_[A-Za-z0-9_=-]+/g, 'npm_[redacted]')
    .trim();
}

function tokenShape(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return { present: false };
  return {
    present: true,
    length: trimmed.length,
    npmTokenPrefixPresent: trimmed.startsWith('npm_'),
  };
}

const gates = {
  handoffPresent: {
    ok: existsSync(HANDOFF),
    path: 'docs/operations/coordination/inbound/from-ledger-ui-npm-token-2026-06-30.md',
  },
  baselineCliPresent: {
    ok: existsSync(BASELINE_CLI),
    path: '../baseline-os/platform/packages/baselineos/dist/cli/bin.js',
  },
  bridgeVaultVerifyAvailable: {
    ok: existsSync(join(BRIDGE_OS, 'package.json')),
    command: 'pnpm --dir ../bridge-os agent:vault:verify',
  },
  canonicalCredentialName: {
    ok: opts.credential === DEFAULT_CREDENTIAL,
    expected: DEFAULT_CREDENTIAL,
    actual: opts.credential,
  },
  vaultCredentialRetrievable: {
    ok: false,
    credential: opts.credential,
    skipped: true,
    reason: 'Pass --execute to verify Baseline vault retrieval without printing the token.',
  },
};

if (opts.execute && gates.baselineCliPresent.ok) {
  const result = run('node', [
    BASELINE_CLI,
    'vault',
    'get',
    opts.credential,
    '--agent-id',
    opts.agentId,
    '--trust-score',
    opts.trustScore,
  ]);

  if (result.status === 0) {
    const shape = tokenShape(result.stdout);
    gates.vaultCredentialRetrievable = {
      ok: shape.present,
      credential: opts.credential,
      agentId: opts.agentId,
      trustScore: Number(opts.trustScore),
      redacted: true,
      shape,
    };
  } else {
    gates.vaultCredentialRetrievable = {
      ok: false,
      credential: opts.credential,
      agentId: opts.agentId,
      trustScore: Number(opts.trustScore),
      redacted: true,
      error: sanitizeError(result.stderr || result.stdout || `exit ${result.status}`),
    };
  }
}

const ok =
  gates.handoffPresent.ok &&
  gates.baselineCliPresent.ok &&
  gates.bridgeVaultVerifyAvailable.ok &&
  gates.canonicalCredentialName.ok &&
  (opts.execute ? gates.vaultCredentialRetrievable.ok : true);

const witness = {
  schema: 'gtcx://fabric-os/ci-npm-token-readiness/v2',
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  vaultSystemOfRecord: 'bridge-os Baseline vault',
  runtimePrimitive: '@baselineos/vault',
  authorityClass: opts.execute ? 'A' : 'R',
  credential: opts.credential,
  tokenUser: 'gtcx-protocol',
  redaction: 'secret value never emitted or written',
  execute: opts.execute,
  gates,
  ok,
  nextAction: ok
    ? 'Run ledger-ui build through the approved runner and attach redacted consumption witness.'
    : `Store ${opts.credential} in the bridge-os/Baseline vault, then rerun with --execute --write.`,
  operatorCommands: [
    `pnpm --dir ../bridge-os agent:vault:verify`,
    `node ../baseline-os/platform/packages/baselineos/dist/cli/bin.js vault store ${opts.credential} --from-env ${opts.credential} --provider npm --type api-key --min-trust-score 90`,
    `pnpm ci:npm-token:readiness -- --execute --write`,
  ],
};

if (opts.write) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (opts.json) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  for (const [name, gate] of Object.entries(gates)) {
    const tag = gate.ok ? 'OK' : gate.skipped ? 'SKIP' : 'FAIL';
    const detail = gate.credential ? ` (${gate.credential})` : gate.path ? ` (${gate.path})` : '';
    console.log(`${tag} ${name}${detail}`);
  }
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — CI npm token readiness`);
  if (opts.write) console.log(`witness: ${OUT}`);
}

process.exit(ok ? 0 : 1);
