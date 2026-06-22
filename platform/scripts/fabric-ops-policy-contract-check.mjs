#!/usr/bin/env node
/**
 * Fabric Ops policy contract checker.
 *
 * Enforces that local repos carry an operations/fabric-contract.json manifest pointing
 * at the centralized Fabric OS operational policy contract.
 *
 * Usage:
 *   node platform/scripts/fabric-ops-policy-contract-check.mjs [--write] [--json]
 *   node platform/scripts/fabric-ops-policy-contract-check.mjs --adopt [--json]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ECOSYSTEM = join(ROOT, '..');
const SPEC_PATH = join(ROOT, 'machine/spec/fabric-ops-policy-contract.json');
const OUT = join(ROOT, 'audit/evidence/fabric-ops-policy-contract-latest.json');
const WRITE = process.argv.includes('--write');
const ADOPT = process.argv.includes('--adopt');
const JSON_OUT = process.argv.includes('--json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function relExists(repoRoot, rel) {
  return existsSync(join(repoRoot, rel));
}

/** PHASE-TAXONOMY: ops↔operations and pm↔machine path aliases. */
function pathAliases(rel) {
  const variants = [rel];
  if (rel.startsWith('operations/')) variants.push(`ops/${rel.slice('operations/'.length)}`);
  if (rel.startsWith('ops/')) variants.push(`operations/${rel.slice('ops/'.length)}`);
  if (rel.startsWith('machine/')) variants.push(`pm/${rel.slice('machine/'.length)}`);
  if (rel.startsWith('pm/')) variants.push(`machine/${rel.slice('pm/'.length)}`);
  return [...new Set(variants)];
}

function anyRefExists(repoRoot, rel) {
  return pathAliases(rel).some((variant) => relExists(repoRoot, variant));
}

function repoExists(name) {
  return existsSync(join(ECOSYSTEM, name, 'package.json'));
}

function localContractCandidates(spec) {
  const paths = [
    spec.localContractPath,
    ...(spec.localContractPathAliases ?? []),
    'ops/fabric-contract.json',
    'operations/fabric-contract.json',
  ].filter(Boolean);
  return [...new Set(paths)];
}

function resolveLocalContractRel(repoRoot, spec) {
  for (const rel of localContractCandidates(spec)) {
    if (relExists(repoRoot, rel)) return rel;
  }
  return spec.localContractPath ?? localContractCandidates(spec)[0];
}

function discoverLocalRefs(repoRoot, domain) {
  return domain.requiredLocalRefs.filter((rel) => anyRefExists(repoRoot, rel));
}

function buildLocalContract(repo, spec) {
  const repoRoot = join(ECOSYSTEM, repo);
  return {
    $schema: 'gtcx://fabric-os/local-fabric-ops-contract/v1',
    repo,
    contractVersion: spec.version,
    centralPolicyContract: spec.contractPath,
    updated: new Date().toISOString().slice(0, 10),
    domains: spec.requiredDomains.map((domain) => ({
      id: domain.id,
      centralRef: domain.centralRef,
      localRefs: discoverLocalRefs(repoRoot, domain),
    })),
  };
}

function validateRepo(repo, spec) {
  const repoRoot = join(ECOSYSTEM, repo);
  const localContractRel = resolveLocalContractRel(repoRoot, spec);
  const localContractPath = join(repoRoot, localContractRel);
  const gates = [];

  const present = existsSync(localContractPath);
  gates.push({
    id: 'local-contract-present',
    ok: present,
    detail: present ? localContractRel : localContractCandidates(spec).join(' | '),
  });

  let contract = null;
  if (present) {
    try {
      contract = readJson(localContractPath);
      gates.push({ id: 'local-contract-json', ok: true, detail: localContractRel });
    } catch (error) {
      gates.push({ id: 'local-contract-json', ok: false, detail: error.message });
    }
  }

  if (!contract) {
    for (const domain of spec.requiredDomains) {
      const localRefs = discoverLocalRefs(repoRoot, domain);
      gates.push({
        id: `domain:${domain.id}:local-ref`,
        ok: localRefs.length > 0,
        detail: localRefs.length
          ? localRefs.join(', ')
          : `missing one of ${domain.requiredLocalRefs.join(', ')}`,
      });
    }
    return { repo, ok: false, gates, localContractRel };
  }

  gates.push({
    id: 'schema',
    ok: contract.$schema === 'gtcx://fabric-os/local-fabric-ops-contract/v1',
    detail: contract.$schema ?? 'missing',
  });
  gates.push({
    id: 'contract-version',
    ok: contract.contractVersion === spec.version,
    detail: contract.contractVersion ?? 'missing',
  });
  gates.push({
    id: 'central-policy-contract',
    ok: contract.centralPolicyContract === spec.contractPath,
    detail: contract.centralPolicyContract ?? 'missing',
  });

  const domainMap = new Map((contract.domains ?? []).map((domain) => [domain.id, domain]));
  for (const domain of spec.requiredDomains) {
    const localDomain = domainMap.get(domain.id);
    gates.push({ id: `domain:${domain.id}:present`, ok: !!localDomain, detail: domain.label });
    if (!localDomain) continue;

    gates.push({
      id: `domain:${domain.id}:central-ref`,
      ok: localDomain.centralRef === domain.centralRef,
      detail: localDomain.centralRef ?? 'missing',
    });

    const localRefs = Array.isArray(localDomain.localRefs) ? localDomain.localRefs : [];
    const existingRefs = localRefs.filter((rel) => relExists(repoRoot, rel));
    const fallbackRefs = existingRefs.length ? existingRefs : discoverLocalRefs(repoRoot, domain);
    gates.push({
      id: `domain:${domain.id}:local-ref`,
      ok: fallbackRefs.length > 0,
      detail: fallbackRefs.length
        ? fallbackRefs.join(', ')
        : `missing existing localRef for ${domain.id}`,
    });
  }

  return { repo, ok: gates.every((gate) => gate.ok), gates, localContractRel };
}

function main() {
  const spec = readJson(SPEC_PATH);
  const repos = spec.fleetRepos.filter(repoExists);
  const missingRepos = spec.fleetRepos.filter((repo) => !repoExists(repo));

  if (ADOPT) {
    for (const repo of repos) {
      const repoRoot = join(ECOSYSTEM, repo);
      const localContractRel = resolveLocalContractRel(repoRoot, spec);
      const localContractPath = join(repoRoot, localContractRel);
      mkdirSync(dirname(localContractPath), { recursive: true });
      writeFileSync(
        localContractPath,
        `${JSON.stringify(buildLocalContract(repo, spec), null, 2)}\n`,
      );
    }
  }

  const results = repos.map((repo) => validateRepo(repo, spec));
  const ok = results.every((result) => result.ok);
  const witness = {
    schema: 'gtcx://fabric-os/fabric-ops-policy-contract-check/v1',
    at: new Date().toISOString(),
    repo: 'fabric-os',
    contract: spec.contractPath,
    localContractPath: spec.localContractPath,
    localContractPathAliases: localContractCandidates(spec),
    checked: results.length,
    missingRepos,
    ok,
    results,
  };

  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log('=== Fabric Ops policy contract check ===\n');
    for (const result of results) {
      const suffix = result.localContractRel ? ` (${result.localContractRel})` : '';
      console.log(`${result.ok ? 'OK' : 'FAIL'} ${result.repo}${suffix}`);
      for (const gate of result.gates.filter((g) => !g.ok)) {
        console.log(`  - ${gate.id}: ${gate.detail ?? 'failed'}`);
      }
    }
    if (missingRepos.length) console.log(`\nmissing local repos: ${missingRepos.join(', ')}`);
    console.log(
      `\n${ok ? 'PASS' : 'FAIL'} — ${results.filter((r) => r.ok).length}/${results.length}`,
    );
    if (WRITE) console.log(`witness: ${OUT}`);
  }

  process.exit(ok ? 0 : 1);
}

main();
