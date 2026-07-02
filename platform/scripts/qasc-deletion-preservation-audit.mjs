#!/usr/bin/env node
/**
 * QASC deletion preservation audit.
 *
 * Scores whether tracked removals were preserved as archive/_delete
 * relocations and whether current worktrees contain bare deletes.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET_ROOT = join(ROOT, '..');
const CONTRACT = join(ROOT, 'machine/spec/qasc-contract.json');
const OUT = join(ROOT, 'audit/evidence/qasc-deletion-preservation-audit-latest.json');
const DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const REPORT = join(ROOT, `audit/reports/qasc-deletion-preservation-audit-${DATE}.md`);

const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');

function arg(name) {
  return process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
}

function listArg(name) {
  return (arg(name) ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function git(repoRoot, args) {
  try {
    return {
      exitCode: 0,
      stdout: execFileSync('git', ['-C', repoRoot, '-c', 'diff.renameLimit=999999', ...args], {
        encoding: 'utf8',
        maxBuffer: 100 * 1024 * 1024,
      }),
      stderr: '',
    };
  } catch (error) {
    return {
      exitCode: error.status ?? 1,
      stdout: error.stdout?.toString() ?? '',
      stderr: error.stderr?.toString() ?? error.message,
    };
  }
}

export function parseNameStatusLog(raw) {
  const commits = [];
  let current = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('@@')) {
      const [hash, shortHash, date, ...subjectParts] = line.slice(2).split('\t');
      current = {
        hash,
        shortHash,
        date,
        subject: subjectParts.join('\t'),
        statuses: [],
      };
      commits.push(current);
      continue;
    }
    if (current && line.trim()) current.statuses.push(line.trim());
  }
  return commits;
}

export function statusLineIsBareDelete(line) {
  return /^D[ MTADRCU?!]\s+/.test(line) || /^[ MTADRCU?!]D\s+/.test(line);
}

export function statusLineIsArchiveDeleteRename(line) {
  return /^R/.test(line) && line.includes('archive/_delete/');
}

function commitHasArchiveDeleteRelocation(statuses) {
  return statuses.some((line) =>
    /(^A\tarchive\/_delete\/)|(^R\d*\t.*\tarchive\/_delete\/)|archive\/_delete\//.test(line),
  );
}

export function analyzeCommits(commits) {
  const risky = [];
  let deleteCommits = 0;
  let archiveDeleteCommits = 0;
  let deletedFiles = 0;

  for (const commit of commits) {
    const deletes = commit.statuses.filter((line) => line.startsWith('D\t'));
    if (!deletes.length) continue;
    deleteCommits += 1;
    deletedFiles += deletes.length;

    const archiveRelocated = commitHasArchiveDeleteRelocation(commit.statuses);
    if (archiveRelocated) {
      archiveDeleteCommits += 1;
      continue;
    }

    risky.push({
      hash: commit.hash,
      shortHash: commit.shortHash,
      date: commit.date,
      subject: commit.subject,
      deleteCount: deletes.length,
      sampleDeletes: deletes.slice(0, 8).map((line) => line.slice(2)),
    });
  }

  const unsafeDeleteCommits = risky.length;
  const historicalScore100 = deleteCommits === 0 ? 100 : Math.round((archiveDeleteCommits / deleteCommits) * 100);
  return {
    deleteCommits,
    archiveDeleteCommits,
    unsafeDeleteCommits,
    deletedFiles,
    historicalScore100,
    risky,
  };
}

export function analyzeCurrentStatus(raw) {
  const lines = raw.split('\n').filter(Boolean);
  const bareDeletes = lines.filter(statusLineIsBareDelete);
  const archiveRenames = lines.filter(statusLineIsArchiveDeleteRename);
  return {
    dirty: lines.length > 0,
    bareDeleteCount: bareDeletes.length,
    archiveRenameCount: archiveRenames.length,
    currentScore100: bareDeletes.length === 0 ? 100 : 0,
    bareDeletes: bareDeletes.slice(0, 40),
    archiveRenames: archiveRenames.slice(0, 40),
  };
}

function requestedRepos(contract) {
  const selected = listArg('--repos');
  if (!selected.length) return contract.fleet.repos;
  const unknown = selected.filter((repo) => !contract.fleet.repos.includes(repo));
  if (unknown.length) throw new Error(`repos outside QASC denominator: ${unknown.join(', ')}`);
  return selected;
}

function auditRepo(repo, since, delegatedSet) {
  const repoRoot = join(FLEET_ROOT, repo);
  if (!existsSync(join(repoRoot, '.git'))) {
    return {
      repo,
      checkoutPresent: false,
      score100: 0,
      remediationOwner: delegatedSet.has(repo) ? 'delegated-agent' : 'fabric-os',
      blockers: [{ area: 'Checkout', blocker: 'repo checkout missing' }],
    };
  }

  const log = git(repoRoot, [
    'log',
    '--since',
    since,
    '--date=short',
    '--find-renames',
    '--pretty=format:@@%H%x09%h%x09%ad%x09%s',
    '--name-status',
  ]);
  const commits = parseNameStatusLog(log.stdout);
  const historical = analyzeCommits(commits);
  const current = analyzeCurrentStatus(git(repoRoot, ['status', '--porcelain=v1']).stdout);
  const score100 = Math.round((historical.historicalScore100 + current.currentScore100) / 2);
  const blockers = [];
  if (historical.unsafeDeleteCommits > 0) {
    blockers.push({
      area: 'Historical deletion preservation',
      blocker: `${historical.unsafeDeleteCommits} commit(s) since ${since} contain bare tracked deletes without archive/_delete relocation`,
    });
  }
  if (current.bareDeleteCount > 0) {
    blockers.push({
      area: 'Current worktree deletion preservation',
      blocker: `${current.bareDeleteCount} current delete(s) must be converted to archive/_delete relocations before commit`,
    });
  }

  return {
    repo,
    checkoutPresent: true,
    remediationOwner: delegatedSet.has(repo) ? 'delegated-agent' : 'fabric-os',
    score100,
    benchmarkScore100: 100,
    historical,
    current,
    atBenchmark: score100 === 100,
    blockers,
  };
}

function renderReport(witness) {
  const rows = witness.repos.map((repo) => {
    const blocker = repo.blockers?.[0]?.blocker ?? 'benchmark reached';
    return `| ${repo.repo} | ${repo.score100}/100 | ${repo.historical?.historicalScore100 ?? 0}/100 | ${repo.current?.currentScore100 ?? 0}/100 | ${repo.remediationOwner} | ${blocker.replace(/\|/g, '\\|')} |`;
  });
  return `---
title: "QASC deletion preservation fleet audit"
status: current
date: ${DATE}
owner: fabric-os
authority: GTCX-QASC-001
version: 1.0.0
---

# QASC Deletion Preservation Fleet Audit

Fleet score: **${witness.score100}/100**.

Window: **${witness.since}** through **${witness.generatedAt}**.

Policy: tracked files must not be removed as bare deletes during repo cleanup.
Retired, superseded, or decomposed content must be preserved under
\`archive/_delete/<reason-date>/...\` so Git records a recoverable relocation.

| Repository | Score | Historical | Current worktree | Remediation owner | First blocker |
| ---------- | ----: | ---------: | ---------------: | ----------------- | ------------- |
${rows.join('\n')}

## Notes

- This audit is intentionally historical. It does not rewrite history.
- Historical gaps require forward-repair archive commits when the content is
  materially useful or policy-critical.
- Current bare deletes must be converted to archive/_delete moves before commit.
- Delegated repositories remain in the denominator; their remediation owner is
  marked only for coordination.

Machine witness: \`audit/evidence/qasc-deletion-preservation-audit-latest.json\`.
`;
}

function main() {
  const contract = readJson(CONTRACT);
  const since = arg('--since') ?? '2026-06-02T00:00:00';
  const delegated = new Set(listArg('--delegated'));
  const repos = requestedRepos(contract).map((repo) => auditRepo(repo, since, delegated));
  const score100 = repos.length ? Math.round(repos.reduce((sum, repo) => sum + repo.score100, 0) / repos.length) : 0;
  const witness = {
    schema: 'gtcx://fabric-os/qasc-deletion-preservation-audit/v1',
    generatedAt: new Date().toISOString(),
    protocolId: contract.protocolId,
    contract: 'machine/spec/qasc-contract.json',
    since,
    score100,
    benchmarkScore100: 100,
    atBenchmark: score100 === 100 && repos.every((repo) => repo.atBenchmark),
    repoCount: repos.length,
    reposAtBenchmark: repos.filter((repo) => repo.atBenchmark).length,
    delegatedRepos: [...delegated],
    totals: {
      unsafeDeleteCommits: repos.reduce((sum, repo) => sum + (repo.historical?.unsafeDeleteCommits ?? 0), 0),
      deletedFiles: repos.reduce((sum, repo) => sum + (repo.historical?.deletedFiles ?? 0), 0),
      currentBareDeletes: repos.reduce((sum, repo) => sum + (repo.current?.bareDeleteCount ?? 0), 0),
      currentArchiveRenames: repos.reduce((sum, repo) => sum + (repo.current?.archiveRenameCount ?? 0), 0),
    },
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
    console.log(`QASC deletion preservation fleet score: ${witness.score100}/100`);
    console.log(`repositories at benchmark: ${witness.reposAtBenchmark}/${witness.repoCount}`);
    console.log(`unsafe delete commits: ${witness.totals.unsafeDeleteCommits}`);
    console.log(`current bare deletes: ${witness.totals.currentBareDeletes}`);
    for (const repo of witness.repos) {
      const blocker = repo.blockers?.[0]?.area ?? 'benchmark reached';
      console.log(`${repo.repo}: ${repo.score100}/100 · historical=${repo.historical?.historicalScore100 ?? 0}/100 · current=${repo.current?.currentScore100 ?? 0}/100 · ${repo.remediationOwner} · ${blocker}`);
    }
    if (WRITE) {
      console.log('witness=audit/evidence/qasc-deletion-preservation-audit-latest.json');
      console.log(`report=audit/reports/qasc-deletion-preservation-audit-${DATE}.md`);
    }
  }

  process.exit(STRICT && !witness.atBenchmark ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
