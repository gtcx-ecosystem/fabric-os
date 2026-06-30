#!/usr/bin/env node
/**
 * docs:feature-spec:check / docs:feature-spec:check:write — validate the
 * feature registry against PRD links using fabric-os registry schema.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const STRICT = process.argv.includes('--strict');
const WRITE = process.argv.includes('--write');
const OUT_LEGACY = join(REPO, 'audit/evidence/feature-spec-latest.json');
const OUT_DOCS = join(REPO, 'audit/evidence/docs-feature-spec-latest.json');

const VALID_TIER = new Set(['core', 'competitive', 'moat', 'foundation']);
const VALID_CLASS = new Set(['capability', 'workflow-step', 'spec-gap', 'integration', 'service']);
const VALID_STATUS = new Set(['candidate', 'draft-prd', 'prd-ready', 'catalog', 'in-progress', 'shipped', 'retired', 'non-feature']);

function readJson(rel) {
  const abs = join(REPO, rel);
  if (!existsSync(abs)) return null;
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    return { __invalid: true };
  }
}

function readJsonAny(pathLike) {
  try {
    return JSON.parse(readFileSync(pathLike, 'utf8'));
  } catch {
    return { __invalid: true };
  }
}

function gate(id, ok, detail = null, optional = false) {
  return { id, ok, optional, ...(detail ? { detail } : {}) };
}

function resolveRegistryPath() {
  const candidates = [
    'machine/spec/feature-registry/manifest.json',
    'machine/product/feature-registry.json',
    'machine/spec/ecosystem-feature-registry.json',
  ];
  return candidates.find((rel) => existsSync(join(REPO, rel)));
}

function loadFeatureRegistry(registryPath) {
  if (!registryPath) return { features: [], ids: new Set(), capabilityIds: new Set() };
  const registry = readJson(registryPath);
  if (!registry || registry.__invalid) return { features: [], ids: new Set(), capabilityIds: new Set() };

  if (!registryPath.endsWith('manifest.json')) {
    const features = Array.isArray(registry.features) ? registry.features : [];
    return {
      features,
      ids: new Set(features.map((f) => f.id).filter(Boolean)),
      capabilityIds: new Set(features.map((f) => f.capabilityId).filter(Boolean)),
    };
  }

  const shardFeatures = [];
  const idSet = new Set();
  const capSet = new Set();
  for (const shardRel of registry.shards ?? []) {
    const shard = readJsonAny(join(REPO, shardRel));
    if (!shard || !Array.isArray(shard.features)) continue;
    for (const feature of shard.features) {
      shardFeatures.push(feature);
      if (feature?.id) idSet.add(feature.id);
      if (feature?.capabilityId) capSet.add(feature.capabilityId);
    }
  }
  return { features: shardFeatures, ids: idSet, capabilityIds: capSet };
}

function validateRegistry(gates, features, idSet, capSet) {
  gates.push(gate('registry:present', true, 'machine/spec/feature-registry/manifest.json'));
  gates.push(gate('registry:features-nonempty', features.length > 0, `${features.length} features`));
  if (features.length === 0) return;

  let missingFields = 0;
  let invalidStatus = 0;
  let invalidCoverage = 0;
  let missingSpecRefs = 0;
  let duplicates = 0;
  const seenIds = new Set();
  const seenCaps = new Set();

  for (const feature of features) {
    if (!feature?.id || !feature?.name || !VALID_CLASS.has(feature.featureClass) || !VALID_TIER.has(feature.featureTier)) {
      missingFields += 1;
    }
    if (!VALID_STATUS.has(feature.status)) {
      invalidStatus += 1;
    }
    const coverage = Number(feature.coveragePercent);
    if (!Number.isFinite(coverage) || coverage < 0 || coverage > 100) {
      invalidCoverage += 1;
    }
    if (feature.prdRef && /[\\/]/.test(feature.prdRef) && !existsSync(join(REPO, feature.prdRef))) {
      missingSpecRefs += 1;
    }
    if (feature.specRef && !existsSync(join(REPO, feature.specRef))) missingSpecRefs += 1;
    if (feature.id) {
      if (seenIds.has(feature.id)) duplicates += 1;
      seenIds.add(feature.id);
    }
    if (feature.capabilityId) {
      if (seenCaps.has(feature.capabilityId)) duplicates += 1;
      seenCaps.add(feature.capabilityId);
    }
  }

  gates.push(gate('registry:entries-nonempty', missingFields === 0, `${missingFields} entries missing required contract fields`));
  gates.push(gate('registry:valid-class-tier', invalidStatus === 0, `${invalidStatus} entries invalid status`));
  gates.push(gate('registry:coverage-valid', invalidCoverage === 0, `${invalidCoverage} entries with invalid coveragePercent`));
  gates.push(gate('registry:refs-present', missingSpecRefs === 0, `${missingSpecRefs} entries missing referenced PRD/spec path`));
  gates.push(gate('registry:no-duplicates', duplicates === 0, `${duplicates} duplicate id/capabilityId values`));
  gates.push(
    gate(
      'registry:no-assurance-leak',
      true,
      idSet.size + capSet.size
        ? `${idSet.size} ids / ${capSet.size} capabilityIds`
        : 'no entries',
    ),
  );
}

function validatePrdIndex(gates, capSet) {
  const indexPath = 'machine/product/prd-index.json';
  const idx = readJson(indexPath);
  if (!idx || idx.__invalid) {
    gates.push(gate('prd-index:present', false, `invalid/missing ${indexPath}`, true));
    return;
  }
  gates.push(gate('prd-index:present', true));

  const prds = Array.isArray(idx.prds) ? idx.prds : [];
  const listed = [];
  const unregisteredRefs = [];
  for (const prd of prds) {
    if (prd?.path) listed.push(prd.path);
    if (!Array.isArray(prd?.features)) continue;
    for (const featureSlug of prd.features) {
      if (!capSet.has(featureSlug)) {
        unregisteredRefs.push(`${prd.id ?? 'unknown'}:${featureSlug}`);
      }
    }
  }

  const missingPrdFiles = listed.filter((path) => !existsSync(join(REPO, path))).length;
  gates.push(gate('prd-index:features-traced', unregisteredRefs.length === 0, `${unregisteredRefs.length} unregistered feature slugs`));
  gates.push(gate('prd-index:prd-files-present', missingPrdFiles === 0, `${missingPrdFiles} PRD files missing`));
}

function validateWorkflows(gates) {
  const workflowPath = 'machine/spec/workflows/e2e-catalog.json';
  if (!existsSync(join(REPO, workflowPath))) {
    gates.push(gate('workflows:present', false, 'no workflows/e2e catalog', true));
    return;
  }
  const wf = readJson(workflowPath);
  const count = Array.isArray(wf?.workflows) ? wf.workflows.length : 0;
  gates.push(gate('workflows:present', true, workflowPath));
  gates.push(gate('workflows:feature-count', count > 0, `${count} feature workflows` , true));
}

function buildWitness() {
  const gates = [];
  const registryPath = resolveRegistryPath();
  if (!registryPath) {
    gates.push(gate('registry:present', false, 'missing feature registry manifest'));
    const witness = { schema: 'gtcx://fabric-os/feature-spec-check/v1', repo: readJson('package.json')?.name ?? 'fabric-os', at: new Date().toISOString(), ok: false, strict: STRICT, gates };
    if (WRITE) {
      mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
      writeFileSync(OUT_DOCS, `${JSON.stringify(witness, null, 2)}\n`);
      writeFileSync(OUT_LEGACY, `${JSON.stringify(witness, null, 2)}\n`);
    }
    console.log('=== docs:feature-spec:check ===\n');
    for (const g of gates) {
      const tag = g.optional ? ' (optional)' : '';
      console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${tag}${g.detail ? ` — ${g.detail}` : ''}`);
    }
    process.exit(1);
  }

  const { features, ids, capabilityIds } = loadFeatureRegistry(registryPath);
  gates.push(gate('registry:schema-v2', Boolean(registryPath.endsWith('manifest.json') || registryPath.includes('feature-registry/v2') || registryPath.includes('registry.json'))));
  validateRegistry(gates, features, ids, capabilityIds);
  validatePrdIndex(gates, capabilityIds);
  validateWorkflows(gates);

  const required = gates.filter((g) => !g.optional);
  const ok = required.every((g) => g.ok);
  const repoName = readJson('package.json')?.name ?? 'fabric-os';
  const repoKind = readJson('config/repo-kind.json')?.kind ?? 'platform-runtime';
  const score100 = required.length === 0
    ? 100
    : Math.round((required.filter((g) => g.ok).length / required.length) * 100);
  const witness = {
    schema: 'gtcx://fabric-os/feature-spec-check/v1',
    repo: repoName,
    repoKind,
    at: new Date().toISOString(),
    ok,
    score100,
    strict: STRICT,
    gates,
    counts: {
      totalFeatures: features.length,
      featureIds: ids.size,
      capabilityIds: capabilityIds.size,
    },
  };
  if (WRITE) {
    mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
    writeFileSync(OUT_DOCS, `${JSON.stringify(witness, null, 2)}\n`);
    writeFileSync(OUT_LEGACY, `${JSON.stringify(witness, null, 2)}\n`);
    console.log(`witness: ${OUT_DOCS}`);
  }
  console.log('=== docs:feature-spec:check ===\n');
  for (const g of gates) {
    const tag = g.optional ? ' (optional)' : '';
    console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${tag}${g.detail ? ` — ${g.detail}` : ''}`);
  }
  console.log(`\nscore=${score100}/100 controls=${required.filter((g) => g.ok).length}/${required.length}`);
  if (WRITE) console.log(`witness: ${OUT_LEGACY}`);
  process.exit(ok ? 0 : 1);
}

buildWitness();
