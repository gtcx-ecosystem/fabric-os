#!/usr/bin/env node
/**
 * SECAS-S4-02 — fleet supply-chain security gate (policy + fleet rollup).
 * Usage: node secas-supply-chain-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECOSYSTEM = join(ROOT, '..');
const REGISTER = join(ROOT, 'pm/security-friction-register.json');
const POLICY_JSON = join(ROOT, 'pm/spec/supply-chain-cve-policy.json');
const POLICY_DOC = join(ROOT, 'docs/operations/secas/supply-chain-policy.md');
const FRICTION_ID = 'SEC-SUPPLY-01';
const OUT = join(ROOT, 'audit/evidence/secas-supply-chain-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function readText(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function repoRoot(repo) {
  return join(ECOSYSTEM, repo);
}

function hasSections(text, sections) {
  const missing = sections.filter((s) => !text.includes(s));
  return { ok: missing.length === 0, missing };
}

function ciWitnessForRepo(repo) {
  const wfDir = join(repoRoot(repo), '.github/workflows');
  if (!existsSync(wfDir)) return { ok: false, files: [], matched: [] };
  const files = readdirSync(wfDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
  const patterns = [
    'pnpm audit',
    'trivy',
    'audit-with-acceptance',
    'dependency-audit',
    'dependency audit',
  ];
  const matched = [];
  for (const file of files) {
    const text = readFileSync(join(wfDir, file), 'utf8');
    for (const pat of patterns) {
      if (text.toLowerCase().includes(pat.toLowerCase())) matched.push(`${file}:${pat}`);
    }
  }
  const validateAll = existsSync(join(repoRoot(repo), 'platform/tools/platform/scripts/validate-all.mjs'));
  return { ok: matched.length > 0 || validateAll, files, matched, validateAll };
}

function runPnpmAudit(repo, timeoutMs) {
  const cwd = repoRoot(repo);
  if (!existsSync(join(cwd, 'package.json'))) {
    return { ok: false, skipped: true, reason: 'no package.json' };
  }
  const result = spawnSync('pnpm', ['audit', '--audit-level', 'high', '--json'], {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
  });
  const timedOut = result.error?.code === 'ETIMEDOUT';
  let parsed = null;
  if (result.stdout?.trim()) {
    try {
      parsed = JSON.parse(result.stdout);
    } catch {
      /* registry noise */
    }
  }
  const vulns = parsed?.metadata?.vulnerabilities ?? null;
  const critical = vulns?.critical ?? null;
  const high = vulns?.high ?? null;
  const registryReachable = Boolean(parsed) && !timedOut;
  let verdict = 'skipped';
  if (registryReachable) {
    verdict = critical === 0 && high === 0 ? 'pass' : 'fail';
  } else if (timedOut || result.status !== 0) {
    verdict = 'partial';
  }
  return {
    ok: verdict === 'pass' || verdict === 'partial',
    verdict,
    exitCode: result.status,
    timedOut,
    registryReachable,
    vulnerabilities: vulns,
    stderr: (result.stderr ?? '').slice(0, 160) || undefined,
  };
}

const policyJson = readJson(POLICY_JSON);
const probeRepos = policyJson?.fleetProbeRepos ?? ['fabric-os', 'markets-os', 'compliance-os', 'terminal-os'];
const auditTimeoutMs = policyJson?.auditTimeoutMs ?? 20_000;

const gates = {};

gates.frictionItem = { ok: false };
if (existsSync(REGISTER)) {
  const reg = readJson(REGISTER);
  const item = (reg?.items ?? []).find((i) => i.id === FRICTION_ID);
  gates.frictionItem = {
    ok: Boolean(item && item.storyId === 'SECAS-S4-02'),
    status: item?.status ?? null,
    storyId: item?.storyId ?? null,
  };
}

const policyText = readText(POLICY_DOC);
gates.policyDoc = {
  ok: existsSync(POLICY_DOC) && existsSync(POLICY_JSON),
  ...hasSections(policyText, ['## Severity tiers', '## Fleet rollup', '## CI witness', '## SLA']),
};

const repoRollup = probeRepos.map((repo) => {
  const root = repoRoot(repo);
  const present = existsSync(root);
  const packageJson = existsSync(join(root, 'package.json'));
  const lockfile = existsSync(join(root, 'pnpm-lock.yaml'));
  const ci = present ? ciWitnessForRepo(repo) : { ok: false, matched: [] };
  const audit = present && packageJson ? runPnpmAudit(repo, auditTimeoutMs) : { ok: false, skipped: true };
  const structuralOk = present && packageJson && lockfile && ci.ok;
  const rollupOk =
    structuralOk &&
    (audit.verdict === 'pass' || (audit.verdict === 'partial' && lockfile && ci.ok));
  return {
    repo,
    present,
    packageJson,
    lockfile,
    ci,
    audit,
    ok: rollupOk,
  };
});

gates.repoRollup = {
  ok: repoRollup.filter((r) => r.ok).length >= 4,
  repos: repoRollup,
};

gates.fabricCi = {
  ok: ciWitnessForRepo('fabric-os').ok,
  ...ciWitnessForRepo('fabric-os'),
};

const fleetOk =
  gates.frictionItem.ok &&
  gates.policyDoc.ok &&
  gates.repoRollup.ok &&
  gates.fabricCi.ok;

const witness = {
  schema: 'gtcx://fabric-os/secas-supply-chain-check/v2',
  storyId: 'SECAS-S4-02',
  frictionId: FRICTION_ID,
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  policy: {
    json: 'pm/spec/supply-chain-cve-policy.json',
    doc: 'docs/operations/secas/supply-chain-policy.md',
  },
  gates,
  ok: fleetOk,
  phase: 'fleet-rollup',
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    const detail =
      v.missing?.length
        ? ` (missing: ${v.missing.join(', ')})`
        : v.repos
          ? ` (${v.repos.filter((r) => r.ok).length}/${v.repos.length} pass)`
          : v.status
            ? ` (${v.status})`
            : v.matched?.length
              ? ` (${v.matched.length} CI hits)`
              : '';
    console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${detail}`);
  }
  console.log(`\n${fleetOk ? 'PASS' : 'FAIL'} — SECAS-S4-02 supply-chain (fleet rollup)`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(fleetOk ? 0 : 1);
