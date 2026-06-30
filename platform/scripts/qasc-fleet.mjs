#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET_ROOT = join(ROOT, '..');
const CONTRACT_REL = 'machine/spec/qasc-contract.json';
const ACCEPTANCE = join(ROOT, 'platform/scripts/qasc-repo.mjs');
const OUT = join(ROOT, 'audit/evidence/qasc-fleet-latest.json');
const DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const REPORT = join(ROOT, `audit/reports/qasc-fleet-${DATE}.md`);
const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');
const JSON_OUT = process.argv.includes('--json');

function arg(name) {
  return process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function requestedRepos(contract) {
  const selected = arg('--repos');
  if (!selected) return contract.fleet.repos;
  const values = selected.split(',').map((value) => value.trim()).filter(Boolean);
  const unknown = values.filter((repo) => !contract.fleet.repos.includes(repo));
  if (unknown.length) throw new Error(`repos outside QASC denominator: ${unknown.join(', ')}`);
  return values;
}

function runRepo(repo, contract) {
  const benchmark = contract.benchmarks.repositoryScore100;
  const repoRoot = join(FLEET_ROOT, repo);
  if (!existsSync(join(repoRoot, '.git'))) {
    return {
      repo,
      checkoutPresent: false,
      score100: 0,
      benchmarkScore100: benchmark,
      atBenchmark: false,
      decision: 'unassessable',
      stopReason: 'checkout-missing',
      blockers: [{ area: 'Checkout', blocker: 'canonical repo checkout is missing' }],
    };
  }

  const result = spawnSync(process.execPath, [ACCEPTANCE, '--repo', repo, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
  let witness = null;
  try {
    witness = JSON.parse(result.stdout);
  } catch {
    return {
      repo,
      checkoutPresent: true,
      score100: 0,
      benchmarkScore100: benchmark,
      atBenchmark: false,
      decision: 'unassessable',
      stopReason: 'witness-unreadable',
      exitCode: result.status ?? 1,
      stderr: (result.stderr ?? '').trim().slice(0, 2000),
      blockers: [{ area: 'Witness', blocker: 'repository QASC witness was unreadable' }],
    };
  }

  const score100 = witness.acceptance?.score100 ?? 0;
  const observedControls = witness.acceptanceTable?.map((row) => row.area) ?? [];
  const missingControls = contract.requiredControls.filter((control) => !observedControls.includes(control));
  const contractScore100 = Math.round(
    ((contract.requiredControls.length - missingControls.length) / contract.requiredControls.length) * 100,
  );
  return {
    repo,
    checkoutPresent: true,
    branch: witness.branch,
    commit: witness.commit,
    score100,
    benchmarkScore100: benchmark,
    controlsAtBenchmark: witness.acceptance?.benchmarkCount ?? 0,
    controlCount: witness.acceptance?.areaCount ?? 0,
    atBenchmark: score100 >= benchmark && witness.decision === 'complete' && contractScore100 === 100,
    contractScore100,
    missingControls,
    decision: witness.decision,
    exitCode: result.status ?? 1,
    mprComposite100: witness.mpr?.composite100 ?? null,
    signalLevel: witness.signal?.level ?? null,
    signalScore100: witness.signal?.score100 ?? null,
    blockers: witness.blockers ?? [],
  };
}

function renderReport(witness) {
  const rows = witness.repos.map((repo) => {
    const blocker = repo.blockers?.[0];
    const next = blocker ? `${blocker.area}: ${blocker.blocker}` : 'benchmark reached';
    return `| ${repo.repo} | ${repo.score100}/100 | ${repo.controlsAtBenchmark ?? 0}/${repo.controlCount ?? 0} | ${repo.mprComposite100 ?? 'unverified'} | ${repo.signalLevel ?? 'unverified'} | ${next.replace(/\|/g, '\\|')} |`;
  });

  return `---
title: "GTCX QASC fleet scorecard"
status: current
date: ${DATE}
owner: fabric-os
authority: GTCX-QASC-001
version: 1.0.0
---

# GTCX QASC Fleet Scorecard

Fleet score: **${witness.score100}/100**. Repositories at benchmark:
**${witness.reposAtBenchmark}/${witness.repoCount}**.

| Repository | QASC score | Controls at benchmark | MPR | SIGNAL | Next remediation |
| ---------- | --------: | --------------------: | --: | -----: | ---------------- |
${rows.join('\n')}

## Loop Determination

- Benchmark: ${witness.benchmarkScore100}/100 per repository.
- Coverage denominator: ${witness.repoCount} explicitly versioned repositories.
- Below-benchmark repositories remain in the remediation loop; no binary pass/fail
  label substitutes for their scores.
- Fleet enforcement exits nonzero while any repository is below benchmark.

Machine witness: \`audit/evidence/qasc-fleet-latest.json\`.
`;
}

const contract = readJson(join(ROOT, CONTRACT_REL));
const benchmark = contract.benchmarks.repositoryScore100;
const repos = requestedRepos(contract).map((repo) => runRepo(repo, contract));
const reposAtBenchmark = repos.filter((repo) => repo.atBenchmark).length;
const score100 = repos.length
  ? Math.round(repos.reduce((sum, repo) => sum + repo.score100, 0) / repos.length)
  : 0;
const witness = {
  schema: 'gtcx://fabric-os/qasc-fleet-score/v1',
  generatedAt: new Date().toISOString(),
  protocolId: contract.protocolId,
  contract: CONTRACT_REL,
  contractVersion: contract.version,
  benchmarkScore100: benchmark,
  score100,
  repoCount: repos.length,
  reposAtBenchmark,
  controlsAtBenchmark: repos.reduce((sum, repo) => sum + (repo.controlsAtBenchmark ?? 0), 0),
  controlCount: repos.reduce((sum, repo) => sum + (repo.controlCount ?? 0), 0),
  atBenchmark: reposAtBenchmark === repos.length,
  repos,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  writeFileSync(REPORT, renderReport(witness));
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log(`GTCX QASC fleet score: ${score100}/100`);
  console.log(`repositories at benchmark: ${reposAtBenchmark}/${repos.length}`);
  for (const repo of repos) {
    const blocker = repo.blockers?.[0];
    console.log(`${repo.repo}: ${repo.score100}/100 · ${repo.controlsAtBenchmark ?? 0}/${repo.controlCount ?? 0} controls · next=${blocker?.area ?? 'benchmark reached'}`);
  }
  if (WRITE) {
    console.log('witness=audit/evidence/qasc-fleet-latest.json');
    console.log(`report=audit/reports/qasc-fleet-${DATE}.md`);
  }
}

process.exit(STRICT && !witness.atBenchmark ? 1 : 0);
