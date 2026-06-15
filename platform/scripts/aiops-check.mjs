#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const isMain = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
export const REPO_ROOT = process.cwd();

function pathOk(rel) {
  return existsSync(join(REPO_ROOT, rel)) || existsSync(join(REPO_ROOT, '..', rel));
}

function readJson(rel) {
  const abs = join(REPO_ROOT, rel);
  if (!existsSync(abs)) return null;
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    return null;
  }
}

function readText(rel) {
  const abs = join(REPO_ROOT, rel);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}

function parseArgs(argv) {
  const args = { write: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--write') args.write = true;
  }
  return args;
}

function hasFrontmatter(text, keys) {
  if (!text?.startsWith('---')) return false;
  const end = text.indexOf('---', 3);
  if (end === -1) return false;
  const fm = text.slice(3, end);
  return keys.every((k) => new RegExp(`^${k}:\\s*`, 'm').test(fm));
}

function hasNoSecrets(text) {
  if (!text) return true;
  return !/(password\s*=|api[_-]?key\s*[:=]|secret\s*[:=])/i.test(text);
}

function runSyntax(rel) {
  try {
    execFileSync(process.execPath, ['--check', join(REPO_ROOT, rel)], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function runTests(rel) {
  try {
    execFileSync(process.execPath, ['--test', join(REPO_ROOT, rel)], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function signalsOk(signals) {
  if (!signals?.signals?.length) return false;
  return signals.signals.every((s) => {
    const paths = [s.deploy, s.modelCard, s.tool, s.evidence, s.register, s.check].filter(Boolean);
    return paths.length > 0 && paths.every((p) => pathOk(p));
  });
}

export function evaluateLane() {
  const errors = [];
  const spec = readJson('pm/spec/aiops-as-a-service.json');
  const runbook = readText('docs/operations/aiops-as-a-service.md');
  const team = readText('docs/operations/aiops-agentic-team.md');
  const friction = readJson('pm/aiops-friction-register.json');
  const signals = readJson('pm/aiops-signals-register.json');
  const mlopsBridge = readJson('pm/spec/mlops-bridge-contract.json');
  const scripts = readJson('package.json')?.scripts ?? {};
  const injection = readJson('audit/evidence/injection-suite-latest.json');

  const scores = {
    compliance: {
      score: spec && runbook && friction && signals && mlopsBridge ? 100 : 0,
      evidence: 'spec+runbook+registers',
    },
    technicalExcellence: {
      score:
        runSyntax('platform/scripts/aiops-check.mjs') &&
        runTests('platform/scripts/tests/aiops-check.test.mjs') &&
        scripts['aiops:check'] &&
        scripts['aiops:check:write']
          ? 100
          : 0,
      evidence: 'check+tests+scripts',
    },
    craft: {
      score:
        hasFrontmatter(runbook, ['title', 'status', 'owner', 'protocol']) &&
        hasFrontmatter(team, ['title', 'status', 'owner', 'protocol'])
          ? 100
          : 0,
      evidence: 'frontmatter',
    },
    worldClass: {
      score: ['README.md', 'docs/operations/README.md', 'CHANGELOG.md'].every((p) => pathOk(p)) ? 100 : 80,
      evidence: 'docs six-pack subset',
    },
    trustAndSafety: {
      score: spec?.authority?.class && hasNoSecrets(JSON.stringify(friction)) ? 100 : 0,
      evidence: 'authority+redaction',
    },
    creativityInnovation: { score: signalsOk(signals) ? 100 : 0, evidence: 'signals paths' },
    commercialValue: { score: injection?.ok === true ? 100 : 50, evidence: 'injection-suite' },
    defensiveMoat: {
      score: pathOk('platform/tools/anomaly-detector/detector.mjs') ? 100 : 0,
      evidence: 'anomaly-detector',
    },
    agenticEmpowerment: {
      score: scripts['aiops:check:write'] && pathOk('platform/scripts/tests/aiops-check.test.mjs') ? 100 : 0,
      evidence: 'harness',
    },
    productEcosystemIntegration: {
      score: pathOk('docs/operations/coordination/from-fabric-os-aiops-rollout-2026-06-15.md') ? 85 : 0,
      evidence: 'handoff',
    },
    ipMagic: {
      score: pathOk('canon-os/docs/governance/protocols/49-aiops-as-a-service/protocol.md') ? 100 : 0,
      evidence: 'P49 hub',
    },
  };

  const pillars = Object.entries(scores).map(([id, s]) => ({ id, ...s }));
  const foundationScore100 = Math.round(
    ['compliance', 'technicalExcellence', 'craft', 'worldClass', 'trustAndSafety'].reduce(
      (a, k) => a + scores[k].score,
      0,
    ) / 5,
  );
  const transformationalScore100 = Math.round(
    Object.keys(scores)
      .filter((k) => !['compliance', 'technicalExcellence', 'craft', 'worldClass', 'trustAndSafety'].includes(k))
      .reduce((a, k) => a + scores[k].score, 0) / 6,
  );
  const overall = foundationScore100 >= 80 ? 'PASS' : 'FAIL';

  const witness = {
    $schema: 'gtcx://fabric-os/aiops-check-witness/v1',
    version: '1.0.0',
    updated: new Date().toISOString(),
    repo: 'fabric-os',
    lane: 'AIOps',
    protocolId: 'P49-AIOPS-AS-A-SERVICE',
    overall,
    foundationScore100,
    transformationalScore100,
    pillars,
    errors,
  };

  return { witness, overall, errors };
}

export function writeWitness(witness, out = 'audit/evidence/aiops-check-latest.json') {
  writeFileSync(join(REPO_ROOT, out), JSON.stringify(witness, null, 2) + '\n');
}

if (isMain) {
  const args = parseArgs(process.argv);
  const { witness, overall } = evaluateLane();
  if (args.write) {
    writeWitness(witness);
    console.log(`aiops:check → audit/evidence/aiops-check-latest.json (${overall})`);
  } else {
    console.log(JSON.stringify(witness, null, 2));
  }
  process.exit(overall === 'PASS' ? 0 : 1);
}
