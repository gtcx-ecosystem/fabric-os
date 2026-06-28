/**
 * Shared workspace domain checks — run from any repo cwd.
 * Protocol 29 — gtcx.workspace.manifest.v3
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function repoRoot() {
  return process.cwd();
}

export function readJson(rel) {
  const abs = join(repoRoot(), rel);
  if (!existsSync(abs)) return { missing: rel, data: null };
  try {
    return { missing: null, data: JSON.parse(readFileSync(abs, 'utf8')) };
  } catch (e) {
    return { missing: null, parseError: `${rel}: ${e.message}`, data: null };
  }
}

function schemaVersion() {
  const rel = existsSync(join(repoRoot(), 'operations/manifest.json'))
    ? 'operations/manifest.json'
    : 'workspace/manifest.json';
  const { data } = readJson(rel);
  return data?.schema ?? 'gtcx.workspace.manifest.v1';
}

const VALID_SCHEMAS = new Set([
  'gtcx.workspace.manifest.v1',
  'gtcx.workspace.manifest.v2',
  'gtcx.workspace.manifest.v3',
]);

export function checkRootManifest() {
  const errors = [];
  const rel = existsSync(join(repoRoot(), 'operations/manifest.json'))
    ? 'operations/manifest.json'
    : 'workspace/manifest.json';
  const { missing, parseError, data } = readJson(rel);
  if (missing) errors.push(missing);
  if (parseError) errors.push(parseError);
  if (data && !VALID_SCHEMAS.has(data.schema)) {
    errors.push(`${rel} schema must be v1, v2, or v3`);
  }
  return errors;
}

export function checkCoordination() {
  const errors = [];
  for (const rel of [
    'operations/coordination/manifest.json',
    'operations/coordination/remaining-work.json',
  ]) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  for (const dir of ['operations/coordination/outbound', 'operations/coordination/inbound']) {
    if (!existsSync(join(repoRoot(), dir))) errors.push(dir);
  }
  return errors;
}

export function checkAttestation() {
  const errors = [];
  for (const rel of [
    'operations/attestation/manifest.json',
    'operations/attestation/gates.local.json',
    'operations/attestation/evidence-index.json',
    'operations/attestation/runners.json',
  ]) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('gates.local.json') && data && !Array.isArray(data.gates)) {
      errors.push('operations/attestation/gates.local.json: gates must be array');
    }
    if (rel.endsWith('runners.json') && data && !Array.isArray(data.runners)) {
      errors.push('operations/attestation/runners.json: runners must be array');
    }
  }
  return errors;
}

/** @deprecated v1 — use checkAttestation for v2+ */
export function checkAssurance() {
  const errors = [];
  for (const rel of ['operations/assurance/gates.local.json', 'operations/assurance/evidence-index.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('gates.local.json') && data && !Array.isArray(data.gates)) {
      errors.push('operations/assurance/gates.local.json: gates must be array');
    }
  }
  return errors;
}

function firstExistingPath(candidates) {
  return candidates.find((rel) => existsSync(join(repoRoot(), rel))) ?? null;
}

export function checkProductManagement() {
  const errors = [];
  for (const rel of ['operations/machine/manifest.json', 'operations/machine/backlog.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('backlog.json') && data && !Array.isArray(data.stories)) {
      errors.push('operations/machine/backlog.json: stories must be array');
    }
  }
  const agileBridge =
    firstExistingPath([
      'docs/agile/roadmap.md',
      'docs/roadmap/agile/planning/roadmaps/roadmap.md',
      'docs/roadmap/agile/README.md',
    ]) ?? (existsSync(join(repoRoot(), 'docs/agile')) ? 'docs/agile' : null);
  if (!agileBridge) {
    errors.push('docs/agile (gtcx-agile bridge — create roadmap.md or run rollout)');
  }
  return errors;
}

export function checkCompliance() {
  const errors = [];
  for (const rel of [
    'operations/compliance/manifest.json',
    'operations/compliance/evidence-index.json',
    'operations/compliance/gaps.json',
  ]) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  return errors;
}

export function checkGtm() {
  const errors = [];
  const { missing, parseError } = readJson('operations/gtm/manifest.json');
  if (missing) errors.push(missing);
  if (parseError) errors.push(parseError);
  const scope = readJson('operations/gtm/scope.json');
  if (scope.missing) errors.push(scope.missing);
  if (scope.parseError) errors.push(scope.parseError);
  const gtmReadme = ['operations/gtm/README.md', 'docs/08-gtm/README.md'].find((p) =>
    existsSync(join(repoRoot(), p)),
  );
  if (!gtmReadme) errors.push('operations/gtm/README.md');
  return errors;
}

export function checkSecurity() {
  const errors = [];
  for (const rel of ['operations/security/manifest.json', 'operations/security/posture.json']) {
    const { missing, parseError } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
  }
  if (!existsSync(join(repoRoot(), 'operations/security/README.md')) && !existsSync(join(repoRoot(), 'docs/09-security/README.md'))) {
    errors.push('operations/security/README.md');
  }
  return errors;
}

export function checkAssurancePrograms() {
  const errors = [];
  for (const rel of ['operations/assurance/manifest.json', 'operations/assurance/programs.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('programs.json') && data && !Array.isArray(data.programs)) {
      errors.push('operations/assurance/programs.json: programs must be array');
    }
  }
  if (
    !existsSync(join(repoRoot(), 'operations/assurance/programs/README.md')) &&
    !existsSync(join(repoRoot(), 'docs/07-assurance/programs/README.md'))
  ) {
    errors.push('operations/assurance/programs/README.md');
  }
  return errors;
}

export function checkAudit() {
  const errors = [];
  for (const rel of [
    'operations/attestation/witness/manifest.json',
    'operations/attestation/witness/evidence-index.json',
  ]) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('evidence-index.json') && data && !Array.isArray(data.artifacts)) {
      errors.push('operations/attestation/witness/evidence-index.json: artifacts must be array');
    }
  }
  for (const rel of ['operations/attestation/witness/README.md', 'audit/README.md']) {
    if (!existsSync(join(repoRoot(), rel))) errors.push(rel);
  }
  return errors;
}

export function checkOperations() {
  const errors = [];
  for (const rel of ['operations/manifest.json', 'operations/verify.json']) {
    const { missing, parseError, data } = readJson(rel);
    if (missing) errors.push(missing);
    if (parseError) errors.push(parseError);
    if (rel.endsWith('verify.json') && data && !Array.isArray(data.commands)) {
      errors.push('operations/verify.json: commands must be array');
    }
  }
  if (!existsSync(join(repoRoot(), 'docs/operations/README.md'))) {
    errors.push('docs/operations/README.md');
  }
  return errors;
}

function checkWorkspaceReadmes() {
  const errors = [];
  for (const rel of [
    'operations/coordination/README.md',
    'operations/machine/README.md',
    'operations/gtm/README.md',
    'operations/compliance/README.md',
    'operations/attestation/README.md',
    'operations/security/README.md',
    'operations/assurance/README.md',
    'operations/README.md',
  ]) {
    if (!existsSync(join(repoRoot(), rel))) errors.push(rel);
  }
  return errors;
}

function checkAgentsFolder() {
  const errors = [];
  const required = [
    ['docs/operations/agents/README.md', 'docs/agents/README.md'],
  ];
  for (const candidates of required) {
    if (!firstExistingPath(candidates)) errors.push(candidates[0]);
  }
  return errors;
}

function checkLegalLens() {
  const errors = [];
  if (!existsSync(join(repoRoot(), 'operations/legal/gates.json')))
    errors.push('operations/legal/gates.json');
  return errors;
}

export function runAll() {
  const schema = schemaVersion();
  const isV3 = schema === 'gtcx.workspace.manifest.v3';
  const isV2Plus = isV3 || schema === 'gtcx.workspace.manifest.v2';

  const results = {
    root: checkRootManifest(),
    coordination: checkCoordination(),
    compliance: checkCompliance(),
    gtm: checkGtm(),
  };

  if (isV3) {
    results.attestation = checkAttestation();
    results['product-management'] = checkProductManagement();
    results.security = checkSecurity();
    results['assurance-programs'] = checkAssurancePrograms();
    results.audit = checkAudit();
    results.operations = checkOperations();
    results.readmes = checkWorkspaceReadmes();
    results.agents = checkAgentsFolder();
    results.legal = checkLegalLens();
  } else if (isV2Plus) {
    results.attestation = checkAttestation();
    results['product-management'] = checkProductManagement();
  } else {
    results.assurance = checkAssurance();
  }

  return results;
}

export function hasErrors(results) {
  return Object.values(results).some((arr) => arr.length > 0);
}
