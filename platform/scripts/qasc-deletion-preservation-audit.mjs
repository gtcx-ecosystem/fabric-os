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

function dateValue(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
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
  const sameCommitScore100 = deleteCommits === 0 ? 100 : Math.round((archiveDeleteCommits / deleteCommits) * 100);
  return {
    deleteCommits,
    archiveDeleteCommits,
    unsafeDeleteCommits,
    deletedFiles,
    sameCommitScore100,
    historicalScore100: sameCommitScore100,
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

export function analyzeExactRecoveryManifest(manifest, options = {}) {
  const expectedDeletedFiles = options.expectedDeletedFiles ?? null;
  const auditSince = options.since ?? null;
  const manifestSince = manifest?.since ?? null;
  const auditSinceValue = auditSince ? dateValue(auditSince) : null;
  const manifestSinceValue = manifestSince ? dateValue(manifestSince) : null;
  const problems = [];

  if (manifest?.schema !== 'gtcx://fabric-os/archive-delete-exact-recovery/v1') {
    problems.push('manifest schema is not archive-delete-exact-recovery/v1');
  }
  if (expectedDeletedFiles !== null && manifest?.deletionEvents !== expectedDeletedFiles) {
    problems.push(`manifest deletionEvents ${manifest?.deletionEvents ?? 'missing'} does not match git deleted file events ${expectedDeletedFiles}`);
  }
  if (auditSinceValue !== null && manifestSinceValue !== null && manifestSinceValue > auditSinceValue) {
    problems.push(`manifest starts at ${manifestSince}; audit window starts at ${auditSince}`);
  }
  if (manifest?.coveredEvents !== manifest?.deletionEvents || manifest?.missingEvents !== 0) {
    problems.push(`manifest coverage is ${manifest?.coveredEvents ?? 0}/${manifest?.deletionEvents ?? 0} with ${manifest?.missingEvents ?? 'unknown'} missing`);
  }

  const score100 =
    problems.length === 0 && manifest?.deletionEvents === 0
      ? 100
      : problems.length === 0
        ? Math.round(((manifest.coveredEvents ?? 0) / manifest.deletionEvents) * 100)
        : 0;

  return {
    present: true,
    valid: problems.length === 0,
    score100,
    since: manifestSince,
    deletionEvents: manifest?.deletionEvents ?? 0,
    uniqueDeletedPaths: manifest?.uniqueDeletedPaths ?? 0,
    coveredEvents: manifest?.coveredEvents ?? 0,
    missingEvents: manifest?.missingEvents ?? null,
    collisionMarkers: manifest?.collisionMarkers ?? 0,
    problems,
  };
}

function readExactRecovery(repoRoot, since, historical) {
  const manifestPath = join(repoRoot, 'archive/_delete/exact-manifest.json');
  if (!existsSync(manifestPath)) {
    return {
      present: false,
      valid: historical.deletedFiles === 0,
      score100: historical.deletedFiles === 0 ? 100 : 0,
      problems: historical.deletedFiles === 0 ? [] : ['archive/_delete/exact-manifest.json missing'],
    };
  }

  const manifest = readJson(manifestPath);
  const result = analyzeExactRecoveryManifest(manifest, {
    expectedDeletedFiles: historical.deletedFiles,
    since,
  });

  if (result.valid && Array.isArray(manifest.events)) {
    const missing = [];
    for (const event of manifest.events) {
      const exact = event.exactArchivePath ? join(repoRoot, event.exactArchivePath) : null;
      const byCommit = event.byCommitArchivePath ? join(repoRoot, event.byCommitArchivePath) : null;
      if (!exact || !byCommit || !existsSync(exact) || !existsSync(byCommit)) {
        missing.push({ path: event.path, exactArchivePath: event.exactArchivePath, byCommitArchivePath: event.byCommitArchivePath });
      }
    }
    if (missing.length) {
      result.valid = false;
      result.score100 = 0;
      result.problems.push(`${missing.length} manifest event(s) point to missing archive files`);
      result.missingArchivePaths = missing.slice(0, 40);
    }
  }

  return result;
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
  const exactRecovery = readExactRecovery(repoRoot, since, historical);
  historical.exactRecovery = exactRecovery;
  historical.historicalScore100 = exactRecovery.valid ? exactRecovery.score100 : historical.sameCommitScore100;
  const current = analyzeCurrentStatus(git(repoRoot, ['status', '--porcelain=v1']).stdout);
  const score100 = Math.round((historical.historicalScore100 + current.currentScore100) / 2);
  const blockers = [];
  if (historical.deletedFiles > 0 && !exactRecovery.valid) {
    blockers.push({
      area: 'Historical exact/by-commit recovery',
      blocker: exactRecovery.problems[0] ?? `${historical.deletedFiles} deleted file event(s) since ${since} lack exact archive coverage`,
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
    const exact = repo.historical?.exactRecovery?.present
      ? `${repo.historical.exactRecovery.coveredEvents}/${repo.historical.exactRecovery.deletionEvents}`
      : 'missing';
    return `| ${repo.repo} | ${repo.score100}/100 | ${repo.historical?.historicalScore100 ?? 0}/100 | ${exact} | ${repo.current?.currentScore100 ?? 0}/100 | ${repo.remediationOwner} | ${blocker.replace(/\|/g, '\\|')} |`;
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

Policy: tracked files must not be removed as unrecoverable bare deletes during
repo cleanup. Retired, superseded, or decomposed content must have exact mirrored
coverage under \`archive/_delete/<original-path>\` plus forensic provenance under
\`archive/_delete/by-commit/<commit>/<original-path>\`.

| Repository | Score | Historical | Exact coverage | Current worktree | Remediation owner | First blocker |
| ---------- | ----: | ---------: | -------------: | ---------------: | ----------------- | ------------- |
${rows.join('\n')}

## Notes

- This audit is intentionally historical. It does not rewrite history.
- Historical gaps require forward-repair archive commits with exact mirrored
  coverage and by-commit provenance.
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
      exactRecoveryGaps: repos.reduce((sum, repo) => sum + (repo.historical?.exactRecovery?.valid === false ? 1 : 0), 0),
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
    console.log(`historical bare-delete commits: ${witness.totals.unsafeDeleteCommits}`);
    console.log(`exact recovery gaps: ${witness.totals.exactRecoveryGaps}`);
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
