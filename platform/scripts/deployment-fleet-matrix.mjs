#!/usr/bin/env node
/**
 * Scores per-repo deployment coverage against the Fabric deployment contract.
 *
 * This is deliberately score-based. Use --strict when a
 * caller wants benchmark enforcement via exit code.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET_ROOT = join(ROOT, '..');
const SPEC_REL = 'machine/spec/deployment-fleet-matrix.json';
const OUT_REL = 'audit/evidence/deployment-fleet-matrix-latest.json';

const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');

function readJson(abs) {
  return JSON.parse(readFileSync(abs, 'utf8'));
}

function readJsonRel(rel) {
  return readJson(join(ROOT, rel));
}

function maybeReadJson(abs) {
  if (!existsSync(abs)) return null;
  try {
    return readJson(abs);
  } catch (error) {
    return { __error: error.message };
  }
}

function relExists(rel) {
  return existsSync(join(ROOT, rel));
}

function repoPath(repo, rel = '') {
  return join(FLEET_ROOT, repo, rel);
}

function scriptNameFromCommand(command) {
  const text = String(command ?? '').trim();
  const match = text.match(/^pnpm\s+(?:run\s+)?([^ ]+)/);
  return match?.[1] ?? null;
}

function scoreControl(id, ok, evidence, remediation = null, weight = 1) {
  return {
    id,
    score100: ok ? 100 : 0,
    weight,
    evidence,
    ...(remediation ? { remediation } : {}),
  };
}

function weightedScore(controls) {
  const applicable = controls.filter((control) => control.weight > 0);
  const weight = applicable.reduce((sum, control) => sum + control.weight, 0);
  if (!weight) return 100;
  return Math.round(
    applicable.reduce((sum, control) => sum + control.score100 * control.weight, 0) / weight,
  );
}

function loadDeploymentProfile(repoRoot) {
  const candidates = [
    'operations/deployment-profile.json',
    'docs/operations/deployment/deployment-profile.json',
  ];

  for (const rel of candidates) {
    const abs = join(repoRoot, rel);
    const json = maybeReadJson(abs);
    if (!json) continue;
    if (json.relocated) {
      const relocatedAbs = join(repoRoot, json.relocated);
      const relocated = maybeReadJson(relocatedAbs);
      return {
        profile: relocated,
        profilePath: json.relocated,
        pointerPath: rel,
        pointer: json,
      };
    }
    return { profile: json, profilePath: rel };
  }

  return { profile: null, profilePath: null };
}

function hasDeployCriticalGithubActions(repoRoot) {
  const workflows = join(repoRoot, '.github/workflows');
  if (!existsSync(workflows)) return { found: false, evidence: '.github/workflows absent' };

  const stack = [workflows];
  const hits = [];
  while (stack.length) {
    const current = stack.pop();
    const entries = existsSync(current)
      ? readFileSync('/dev/null', 'utf8') || null
      : null;
    void entries;
    for (const entry of globalThis.__readdir(current)) {
      const abs = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (!/\.(ya?ml)$/i.test(entry.name)) continue;
      const text = readFileSync(abs, 'utf8');
      if (/(terraform\s+apply|kubectl\s+apply|argocd\s+app\s+sync|aws\s+eks\s+update-kubeconfig)/i.test(text)) {
        hits.push(abs.replace(repoRoot + '/', ''));
      }
    }
  }

  return {
    found: hits.length > 0,
    evidence: hits.length ? hits.join(', ') : '.github/workflows contains no production deploy executor commands',
  };
}

// Keep readdir lazy-loaded so tests can import this script on older Node without
// needing a separate helper module.
import { readdirSync } from 'node:fs';
globalThis.__readdir = (dir) => readdirSync(dir, { withFileTypes: true });

function evaluateRepo(entry, role, spec, fleetRepos) {
  const repoRoot = repoPath(entry.repo);
  const repoExists = existsSync(repoRoot);
  const packageJson = repoExists ? maybeReadJson(join(repoRoot, 'package.json')) : null;
  const scripts = packageJson?.scripts ?? {};
  const { profile, profilePath, pointerPath } = repoExists
    ? loadDeploymentProfile(repoRoot)
    : { profile: null, profilePath: null, pointerPath: null };
  const controls = [];

  controls.push(
    scoreControl(
      'repo-present',
      repoExists,
      repoExists ? `../${entry.repo}` : `missing ../${entry.repo}`,
      'Restore checkout or remove repo from fleet deployment matrix.',
    ),
  );

  controls.push(
    scoreControl(
      'fleet-contract-listed',
      fleetRepos.includes(entry.repo),
      'machine/fleet-audit-contracts.json',
      'Align deployment matrix with the fleet audit contract.',
    ),
  );

  controls.push(
    scoreControl(
      'role-known',
      Boolean(role),
      entry.role,
      'Use a deployment-fleet-matrix role declared under roles.',
    ),
  );

  if (role?.requiresDeploymentProfile) {
    controls.push(
      scoreControl(
        'deployment-profile',
        Boolean(profile && !profile.__error),
        profilePath ?? 'missing deployment profile',
        'Add a repo-local deployment profile or a relocation pointer to the canonical profile.',
      ),
    );
  } else if (profile) {
    controls.push(
      scoreControl(
        'deployment-profile-optional',
        !profile.__error,
        pointerPath ? `${pointerPath} -> ${profilePath}` : profilePath,
        'Fix malformed deployment profile JSON.',
      ),
    );
  }

  if (profile) {
    const handoff = String(profile.handoffTemplate ?? profile.rollback?.coordinationPath ?? '');
    controls.push(
      scoreControl(
        'no-retired-infra-alias',
        !/gtcx-infrastructure/i.test(handoff),
        handoff || 'no handoff template declared',
        'Route deployment handoffs to fabric-os, not retired gtcx-infrastructure aliases.',
      ),
    );
    controls.push(
      scoreControl(
        'profile-owner-matches-repo',
        !profile.owner || profile.owner === entry.repo,
        `owner=${profile.owner ?? 'not declared'}`,
        'Set deployment profile owner to the repo id.',
      ),
    );
  }

  if (role?.requiresBuildScript) {
    controls.push(
      scoreControl(
        'source-build-signal',
        Boolean(scripts.build || scripts['web:build'] || scripts['build:production']),
        Object.keys(scripts).filter((key) => /^(build|web:build|build:production)$/.test(key)).join(', ') || 'missing build script',
        'Expose a deterministic build/package command in package.json.',
      ),
    );
  }

  if (role?.requiresSmokeOrReadiness) {
    const command = profile?.smokeCommand ?? profile?.readinessCommand ?? null;
    const script = scriptNameFromCommand(command);
    const hasProfileScript = script ? Boolean(scripts[script]) : false;
    const fallbackScripts = Object.keys(scripts).filter((key) =>
      /(smoke|readiness|ops:check|operations:check|deploy:readiness|deployment:smoke)/i.test(key),
    );
    controls.push(
      scoreControl(
        'smoke-or-readiness-signal',
        Boolean(hasProfileScript || fallbackScripts.length),
        command ? `${command}${hasProfileScript ? '' : ' (script missing)'}` : fallbackScripts.join(', ') || 'missing smoke/readiness script',
        'Add a repo-local smoke/readiness command that Fabric can cite after deploy.',
      ),
    );
  }

  if (role?.requiresFabricManifest) {
    const manifests = entry.fabricManifests ?? [];
    controls.push(
      scoreControl(
        'fabric-manifest-declared',
        manifests.length > 0,
        manifests.length ? manifests.join(', ') : 'no Fabric manifest declared',
        'Declare the Fabric-owned manifest path or explicitly reclassify the repo as non-runtime/static.',
      ),
    );
    for (const rel of manifests) {
      controls.push(
        scoreControl(
          `fabric-manifest:${rel}`,
          relExists(rel),
          rel,
          'Create or repair the Fabric-owned Kubernetes/GitOps manifest path.',
        ),
      );
    }
  }

  if (entry.liveEvidence) {
    for (const rel of entry.liveEvidence) {
      controls.push(
        scoreControl(
          `live-evidence:${rel}`,
          relExists(rel),
          rel,
          'Refresh the live deployment evidence witness.',
        ),
      );
    }
  }

  const gha = repoExists
    ? hasDeployCriticalGithubActions(repoRoot)
    : { found: false, evidence: 'repo missing' };
  controls.push(
    scoreControl(
      'github-actions-not-prod-executor',
      !gha.found,
      gha.evidence,
      'Remove production deploy execution from GitHub Actions; route through Fabric CodeBuild/Argo CD.',
    ),
  );

  if (entry.role === 'governance-no-runtime') {
    const runtimeSurfaces = ['Dockerfile', 'deploy/kubernetes'].filter((rel) =>
      existsSync(join(repoRoot, rel)),
    );
    controls.push(
      scoreControl(
        'no-runtime-surface-required',
        runtimeSurfaces.length === 0,
        runtimeSurfaces.length ? runtimeSurfaces.join(', ') : 'no runtime deployment surface',
        'Either remove stale runtime surfaces or reclassify the repo with a deployment profile.',
      ),
    );
  }

  const score100 = weightedScore(controls);
  return {
    repo: entry.repo,
    role: entry.role,
    owner: entry.owner,
    score100,
    benchmarkScore100: spec.benchmarkScore100,
    atBenchmark: score100 >= spec.benchmarkScore100,
    evidence: {
      repoPath: repoExists ? `../${entry.repo}` : null,
      deploymentProfile: profilePath,
      fabricManifests: entry.fabricManifests ?? [],
    },
    controls,
    belowBenchmark: controls.filter((control) => control.score100 < 100),
    notes: entry.notes ?? null,
  };
}

function main() {
  const spec = readJsonRel(SPEC_REL);
  const fleetContracts = readJsonRel('machine/fleet-audit-contracts.json');
  const fleetRepos = (fleetContracts.repos ?? []).map((entry) => entry.repo);

  const globalControls = [
    scoreControl('deployment-contract', relExists(spec.globalControls.deploymentOpsContract), spec.globalControls.deploymentOpsContract),
    scoreControl('codebuild-start-script', relExists(spec.globalControls.codebuildStart), spec.globalControls.codebuildStart),
    scoreControl('codebuild-runner-script', relExists(spec.globalControls.codebuildRunner), spec.globalControls.codebuildRunner),
    scoreControl('codebuild-module', relExists(spec.globalControls.codebuildModule), spec.globalControls.codebuildModule),
    scoreControl('argocd-module', relExists(spec.globalControls.argocdModule), spec.globalControls.argocdModule),
    scoreControl('staging-overlay', relExists(spec.globalControls.stagingOverlay), spec.globalControls.stagingOverlay),
    scoreControl('production-overlay', relExists(spec.globalControls.productionOverlay), spec.globalControls.productionOverlay),
    scoreControl('codebuild-start-evidence', relExists(spec.globalControls.latestCodebuildStartEvidence), spec.globalControls.latestCodebuildStartEvidence),
    scoreControl('codebuild-runner-evidence', relExists(spec.globalControls.latestCodebuildRunnerEvidence), spec.globalControls.latestCodebuildRunnerEvidence),
  ];

  const repos = spec.repos.map((entry) =>
    evaluateRepo(entry, spec.roles[entry.role], spec, fleetRepos),
  );

  const repoScore = repos.length
    ? Math.round(repos.reduce((sum, repo) => sum + repo.score100, 0) / repos.length)
    : 0;
  const globalScore = weightedScore(globalControls);
  const score100 = Math.round((repoScore + globalScore) / 2);

  const witness = {
    schema: 'gtcx://fabric-os/deployment-fleet-matrix-score/v1',
    generatedAt: new Date().toISOString(),
    repo: 'fabric-os',
    benchmarkScore100: spec.benchmarkScore100,
    score100,
    globalScore100: globalScore,
    repoAverageScore100: repoScore,
    repoCount: repos.length,
    reposAtBenchmark: repos.filter((repo) => repo.atBenchmark).length,
    githubActionsCriticalPath: false,
    runtimeCloud: spec.runtimeCloud,
    controlsAtBenchmark: globalControls.filter((control) => control.score100 >= 100).length
      + repos.reduce((sum, repo) => sum + repo.controls.filter((control) => control.score100 >= 100).length, 0),
    controlCount: globalControls.length + repos.reduce((sum, repo) => sum + repo.controls.length, 0),
    globalControls,
    repos,
    benchmarkGaps: repos
      .filter((repo) => !repo.atBenchmark)
      .map((repo) => ({
        repo: repo.repo,
        role: repo.role,
        score100: repo.score100,
        gaps: repo.belowBenchmark.map((control) => ({
          id: control.id,
          evidence: control.evidence,
          remediation: control.remediation,
        })),
      })),
  };

  if (WRITE) {
    const out = join(ROOT, OUT_REL);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(witness) + '\n');
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(witness));
  } else {
    console.log('=== Deployment fleet matrix score ===\n');
    console.log(`score: ${witness.score100}/100`);
    console.log(`global: ${witness.globalScore100}/100`);
    console.log(`repo average: ${witness.repoAverageScore100}/100`);
    console.log(`repos at benchmark: ${witness.reposAtBenchmark}/${witness.repoCount}`);
    console.log(`controls at benchmark: ${witness.controlsAtBenchmark}/${witness.controlCount}`);
    console.log('\nrepo scores:');
    for (const repo of repos) {
      const gaps = repo.belowBenchmark.map((control) => control.id).join(', ');
      console.log(`- ${repo.repo}: ${repo.score100}/100 (${repo.role})${gaps ? ` — gaps: ${gaps}` : ''}`);
    }
    if (WRITE) console.log(`\nwitness: ${OUT_REL}`);
    if (STRICT && witness.score100 < witness.benchmarkScore100) {
      console.log(`\nbenchmark not reached: ${witness.score100}/${witness.benchmarkScore100}`);
    }
  }

  if (STRICT && witness.score100 < witness.benchmarkScore100) return 1;
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error.stack ?? error.message);
  process.exit(1);
}
