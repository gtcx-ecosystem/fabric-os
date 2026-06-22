import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** PHASE-TAXONOMY: ops↔operations and pm↔machine path aliases. */
export function pathAliases(rel) {
  const variants = [rel];
  if (rel.startsWith('operations/')) variants.push(`ops/${rel.slice('operations/'.length)}`);
  if (rel.startsWith('ops/')) variants.push(`operations/${rel.slice('ops/'.length)}`);
  if (rel.startsWith('machine/')) variants.push(`pm/${rel.slice('machine/'.length)}`);
  if (rel.startsWith('pm/')) variants.push(`machine/${rel.slice('pm/'.length)}`);
  return [...new Set(variants)];
}

export function anyExists(repoRoot, rel) {
  return pathAliases(rel).some((variant) => existsSync(join(repoRoot, variant)));
}

export function resolveBridgeSpec(bridgeRoot, rel) {
  for (const variant of pathAliases(rel)) {
    const path = join(bridgeRoot, variant);
    if (existsSync(path)) return path;
  }
  return join(bridgeRoot, rel);
}

export function resolveOpsDoc(repoRoot, basename) {
  const candidates = [
    `docs/operations/${basename}`,
    `docs/operations/runbooks/${basename}`,
    `docs/operations/platform-services/${basename}`,
  ];
  for (const rel of candidates) {
    if (existsSync(join(repoRoot, rel))) return rel;
  }
  return candidates[0];
}

export function ecosystemRefExists(ecosystemRoot, ref) {
  const [repo, ...rest] = ref.split('/');
  return anyExists(join(ecosystemRoot, repo), rest.join('/'));
}
