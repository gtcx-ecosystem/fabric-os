/**
 * Docs folder hygiene gates — sprawl detection per W13 policy
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

export function loadHygienePolicy(repoRoot) {
  const local = join(repoRoot, 'machine/spec/docs-folder-hygiene-policy.json');
  const canon = join(repoRoot, '../canon-os/pm/spec/docs-folder-hygiene-policy.json');
  const path = existsSync(local) ? local : canon;
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function isPointerReadme(filePath) {
  if (!existsSync(filePath)) return false;
  const text = readFileSync(filePath, 'utf8');
  return (
    /status:\s*pointer/i.test(text) ||
    /\*\*Canonical/.test(text) ||
    /relocated/i.test(text)
  );
}

export function looseMdAtRoot(dir, allowlist) {
  if (!existsSync(dir)) return [];
  const allowed = new Set(allowlist ?? []);
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && !allowed.has(e.name))
    .map((e) => e.name);
}

export function countMdFiles(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  const walk = (d) => {
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
      const p = join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.md')) n++;
    }
  };
  walk(dir);
  return n;
}

export function folderHasBodiesBeyondReadme(relPath, repoRoot) {
  const abs = join(repoRoot, relPath);
  if (!existsSync(abs)) return false;
  const entries = readdirSync(abs, { withFileTypes: true });
  const nonReadme = entries.filter((e) => e.name !== 'README.md');
  if (nonReadme.length === 0) return false;
  if (nonReadme.length === 1 && nonReadme[0].isFile() && isPointerReadme(join(abs, 'README.md'))) {
    return false;
  }
  return true;
}

export function checkForbiddenAbsentUnderDocs(policy, repoRoot, gates) {
  for (const entry of policy.forbiddenUnderDocsAbsent ?? []) {
    const abs = join(repoRoot, entry.path);
    gates.push(
      gate(
        `absent:${entry.path.replace(/\//g, '-')}`,
        !existsSync(abs),
        existsSync(abs) ? `delete — canonical: ${entry.canonical}` : 'absent',
      ),
    );
  }
}

export function checkForbiddenLegacyFolders(policy, repoRoot, gates) {
  for (const leg of policy.forbiddenTopLevelWithBodies ?? []) {
    const hasBodies = folderHasBodiesBeyondReadme(leg.path, repoRoot);
    const readme = join(repoRoot, leg.path, 'README.md');
    const pointerOk = !hasBodies || (existsSync(readme) && isPointerReadme(readme) && countMdFiles(join(repoRoot, leg.path)) <= 1);
    gates.push(
      gate(
        `legacy:${leg.path.replace(/\//g, '-')}`,
        !hasBodies || pointerOk,
        hasBodies ? `bodies remain — canonical: ${leg.canonical}` : 'absent or pointer-only',
      ),
    );
  }
}

export function checkLayerRootSprawl(policy, repoRoot, gates) {
  for (const [layerPath, allowlist] of Object.entries(policy.layerRootAllowlist ?? {})) {
    const abs = join(repoRoot, layerPath);
    if (!existsSync(abs)) continue;
    const loose = looseMdAtRoot(abs, allowlist);
    const max =
      layerPath === 'docs/operations/' ? (policy.thresholds?.maxLooseMdAtOperationsRoot ?? 2) : 0;
    gates.push(
      gate(
        `sprawl:${layerPath.replace(/\//g, '')}`,
        loose.length <= max,
        loose.length ? `relocate: ${loose.join(', ')}` : 'clean',
      ),
    );
  }
}

export function checkDuplicateSpecsTree(repoRoot, gates) {
  const topSpecs = join(repoRoot, 'docs/specs');
  const archSpecs = join(repoRoot, 'docs/architecture/specs');
  if (!existsSync(topSpecs)) {
    gates.push(gate('duplicate:docs-specs', true, 'no top-level docs/specs'));
    return;
  }
  const topCount = countMdFiles(topSpecs);
  const pointerOnly = topCount <= 1 && isPointerReadme(join(topSpecs, 'README.md'));
  gates.push(
    gate(
      'duplicate:docs-specs',
      pointerOnly,
      pointerOnly ? 'pointer-only' : `${topCount} md under docs/specs — merge to docs/architecture/specs/`,
    ),
  );
  if (existsSync(archSpecs)) {
    gates.push(gate('canonical:architecture-specs', true, 'docs/architecture/specs/ present'));
  }
}

export function sprawlMetrics(repoRoot) {
  const docs = join(repoRoot, 'docs');
  if (!existsSync(docs)) return {};
  const topLevel = readdirSync(docs, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => ({
      name: e.name,
      mdCount: countMdFiles(join(docs, e.name)),
      looseRoot: looseMdAtRoot(join(docs, e.name), ['README.md', 'FOLDER-SPEC.md', 'scorecard.md', 'index.md', 'SUMMARY.md']).length,
    }))
    .sort((a, b) => b.mdCount - a.mdCount);
  return {
    totalMd: countMdFiles(docs),
    topLevelFolders: topLevel.slice(0, 12),
  };
}
