/**
 * Resolve docs pack specs — merge local repo pack with canon-os upstream full spec.
 * Stub packs (upstreamSpec only) are not enforcement sources; they must resolve.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const STUB_MAX_BYTES = 1200;

export function packKind(spec) {
  if (!spec) return 'unknown';
  if (Array.isArray(spec.requiredFiles) && spec.requiredFiles.length > 0) return 'foundation';
  if (spec.requiredSubfolders && spec.$schema?.includes('agents-pack')) return 'agents';
  if (spec.requiredSubfolders && spec.$schema?.includes('agents')) return 'agents';
  if (spec.$schema?.includes('agile-pack')) return 'agile';
  if (spec.canonicalPath === 'agile') return 'agile';
  if (spec.requiredSubfolders && spec.$schema?.includes('roadmap')) return 'roadmap';
  if (spec.requiredSubfolders && spec.$schema?.includes('operations')) return 'operations';
  if (spec.requiredSubfolders && spec.$schema?.includes('product')) return 'product';
  if (spec.requiredSubfolders && spec.$schema?.includes('architecture')) return 'architecture';
  if (spec.requiredSubfolders) return 'business';
  return 'unknown';
}

export function isStubPack(spec, rawBytes = 0) {
  if (!spec || typeof spec !== 'object') return true;

  const kind = packKind(spec);
  const hasProfiles = spec.profiles && Object.keys(spec.profiles).length > 0;

  if (kind === 'foundation') {
    const hasRequiredFiles = Array.isArray(spec.requiredFiles) && spec.requiredFiles.length >= 6;
    if (hasRequiredFiles && hasProfiles) return false;
    if (spec.upstreamSpec && rawBytes > 0 && rawBytes <= STUB_MAX_BYTES) return true;
    return !hasRequiredFiles;
  }

  const hasSubfolders = spec.requiredSubfolders && Object.keys(spec.requiredSubfolders).length > 0;
  const hasRootFiles = Array.isArray(spec.requiredRootFiles) && spec.requiredRootFiles.length > 0;
  if (spec.$schema?.includes('docs-strategy-pack') && hasProfiles && hasRootFiles) return false;
  if (spec.$schema?.includes('docs-architecture-pack') && hasProfiles && hasRootFiles) return false;
  // v2 BMC business pack — flat canvas; requiredSubfolders intentionally empty
  if (spec.$schema?.includes('docs-business-pack') && hasProfiles && hasRootFiles) return false;
  if (spec.fleetCanonical === true && hasProfiles) return false;
  if (hasProfiles && hasSubfolders && hasRootFiles) return false;
  if (spec.upstreamSpec && rawBytes > 0 && rawBytes <= STUB_MAX_BYTES) return true;
  return !hasProfiles || !hasSubfolders || !hasRootFiles;
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function resolveDocsPack(repoRoot, packName, options = {}) {
  const canonicalName =
    packName === 'docs-agents-pack.json' && existsSync(join(repoRoot, 'pm/spec/agents-pack.json'))
      ? 'agents-pack.json'
      : packName === 'docs-agents-pack.json'
        ? 'agents-pack.json'
        : packName === 'docs-agile-pack.json' && existsSync(join(repoRoot, 'pm/spec/agile-pack.json'))
          ? 'agile-pack.json'
          : packName === 'docs-agile-pack.json'
            ? 'agile-pack.json'
            : packName;
  const localPath = join(repoRoot, 'pm/spec', canonicalName);
  const canonPath = join(repoRoot, '../canon-os/pm/spec', canonicalName);
  const pathsTried = [];

  let local = null;
  let localBytes = 0;
  let localIsStub = false;

  if (existsSync(localPath)) {
    localBytes = readFileSync(localPath).length;
    local = readJson(localPath);
    localIsStub = isStubPack(local, localBytes);
    pathsTried.push(localPath);
  }

  let upstream = null;
  let upstreamPath = null;

  const upstreamRel = local?.upstreamSpec;
  if (upstreamRel) {
    upstreamPath = resolve(repoRoot, upstreamRel);
    if (existsSync(upstreamPath)) {
      upstream = readJson(upstreamPath);
      pathsTried.push(upstreamPath);
    }
  }

  if (!upstream && existsSync(canonPath)) {
    upstreamPath = canonPath;
    upstream = readJson(upstreamPath);
    pathsTried.push(canonPath);
  }

  const merged = upstream ? { ...upstream, ...(local ?? {}) } : local;
  if (merged && local?.repo) merged.repo = local.repo;
  if (merged && local?.upstreamSpec) merged.upstreamSpec = local.upstreamSpec;
  if (merged && local?.requiredFiles) merged.requiredFiles = local.requiredFiles;

  const resolved = merged && !isStubPack(merged) ? merged : upstream ?? merged;
  const resolvedIsFull = resolved && !isStubPack(resolved);

  return {
    localPath: existsSync(localPath) ? localPath : null,
    upstreamPath,
    pathsTried,
    local,
    localBytes,
    localIsStub,
    upstream,
    resolved,
    resolvedIsFull,
    kind: packKind(resolved),
    forbidStubPass: options.forbidStubPass !== false,
  };
}

export function profileKeyFromTier(tier, repoRoot = null) {
  if (tier === 'fleet-documentation') return 'fleet-documentation';
  if (tier === 'canon-service' || tier === 'program-office') return 'constitution-standards';
  if (tier === 'platform-runtime') return 'platform-runtime';
  if (repoRoot) {
    const sorPath = join(repoRoot, 'docs/sor.json');
    if (existsSync(sorPath)) {
      try {
        const kind = JSON.parse(readFileSync(sorPath, 'utf8')).repoKind;
        if (kind === 'platform-runtime') return 'platform-runtime';
      } catch {
        /* ignore */
      }
    }
  }
  if (tier === 'platform' || tier === 'fleet-agile' || tier === 'monorepo-root') return 'platform';
  return 'product';
}

export function readProductTier(repoRoot) {
  const goalsPath = join(repoRoot, 'pm/spec/product-goals.json');
  if (!existsSync(goalsPath)) return null;
  try {
    return JSON.parse(readFileSync(goalsPath, 'utf8')).tier ?? null;
  } catch {
    return null;
  }
}
