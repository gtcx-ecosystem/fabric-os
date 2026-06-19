#!/usr/bin/env node
/**
 * docs:business:check — strict docs/business/ pack per resolved docs-business-pack.json
 * Resolves full spec from canon-os upstream; stub-only local packs fail.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import {
  isStubPack,
  profileKeyFromTier,
  readProductTier,
  resolveDocsPack,
} from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-business-latest.json');
const PACK = 'docs-business-pack.json';
const DECOMPOSE_EXEMPT_FILES = new Set(['README.md', 'FOLDER-SPEC.md', 'index.md']);
const DECOMPOSE_EXEMPT_DIRS = new Set(['agentic', 'roadmap']);

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function isPointerStub(filePath) {
  if (!existsSync(filePath)) return false;
  const text = readFileSync(filePath, 'utf8');
  if (!text.startsWith('---')) return false;
  const fmEnd = text.indexOf('---', 3);
  const fm = fmEnd > 0 ? text.slice(0, fmEnd + 3) : text.slice(0, 400);
  return /status:\s*pointer/i.test(fm) || /\*\*Canonical SoR:\*\*/.test(text);
}

function countNarrativeMarkdown(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  const walk = (d, rel = '') => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const p = join(d, e.name);
      const relPath = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (DECOMPOSE_EXEMPT_DIRS.has(e.name)) continue;
        walk(p, relPath);
        continue;
      }
      if (!e.name.endsWith('.md') || DECOMPOSE_EXEMPT_FILES.has(e.name)) continue;
      if (isPointerStub(p)) continue;
      n += 1;
    }
  };
  walk(dir);
  return n;
}

function hasNarrativeInReference(repoRoot, pattern) {
  const rel = pattern.replace(/\/$/, '');
  const abs = join(repoRoot, rel);
  return countNarrativeMarkdown(abs) > 0;
}

function main() {
  const gates = [];
  const resolution = resolveDocsPack(REPO, PACK);
  const spec = resolution.resolved;
  const repoName = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;

  gates.push(
    gate(
      'spec:local-present',
      !!resolution.localPath || existsSync(join(REPO, '../canon-os/pm/spec', PACK)),
      resolution.localPath ?? 'missing pm/spec/docs-business-pack.json',
    ),
  );

  gates.push(
    gate(
      'spec:not-stub',
      !resolution.localIsStub,
      resolution.localIsStub
        ? 'local pack is upstream pointer only — run pnpm docs:fleet:business:upgrade --write'
        : 'full local pack',
    ),
  );

  gates.push(
    gate(
      'spec:resolved-full',
      resolution.resolvedIsFull,
      resolution.resolvedIsFull
        ? (resolution.upstreamPath ? `resolved via ${resolution.upstreamPath}` : 'local full pack')
        : 'could not resolve profiles + requiredSubfolders from canon-os',
    ),
  );

  if (!spec || !resolution.resolvedIsFull) {
    emit(gates, repoName, resolution);
    return;
  }

  const tier = readProductTier(REPO);
  const profileKey = profileKeyFromTier(tier);
  const profile = spec.profiles?.[profileKey] ?? spec.profiles?.product;

  gates.push(gate('profile', !!profile, profileKey));

  const businessDir = join(REPO, 'docs/business');
  const businessExists = existsSync(businessDir);

  if (!profile?.businessRequired && !businessExists) {
    gates.push(gate('business-optional-skip', true, `${profileKey} — business not required`));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  if (profileKey === 'constitution-standards') {
    gates.push(gate('hub:readme', existsSync(join(businessDir, 'README.md')), 'docs/business/README.md'));
    if (existsSync(join(businessDir, 'README.md'))) {
      const readme = readFileSync(join(businessDir, 'README.md'), 'utf8');
      gates.push(
        gate(
          'hub:ecosystem-pointer',
          /ecosystem-os/i.test(readme),
          'constitution-standards README must point to ecosystem-os',
        ),
      );
    }
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  if (profileKey === 'platform' && !profile?.businessRequired && !businessExists) {
    gates.push(gate('business-optional-skip', true, 'platform — business optional'));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  for (const entry of spec.requiredRootFiles ?? []) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const rootReadme = join(businessDir, 'README.md');
  if (existsSync(rootReadme)) {
    const text = readFileSync(rootReadme, 'utf8');
    gates.push(
      gate(
        'root-readme:cross-ref',
        /cross-ref/i.test(text) && /foundation/i.test(text),
        'README must link foundation ↔ business (cross-ref table)',
      ),
    );
  }

  const folderSpec = join(businessDir, 'FOLDER-SPEC.md');
  if (existsSync(folderSpec)) {
    const text = readFileSync(folderSpec, 'utf8');
    gates.push(
      gate(
        'root-folder-spec:pack-link',
        /docs-business-pack/i.test(text),
        'FOLDER-SPEC must cite docs-business-pack.json',
      ),
    );
  }

  const requiredSubs = profile?.requiredSubfolders ?? [];
  const optionalSubs = profile?.optionalSubfolders ?? [];

  for (const sub of requiredSubs) {
    const def = spec.requiredSubfolders?.[sub];
    const dir = join(businessDir, sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `docs/business/${sub}/`));
    if (def?.required?.includes('README.md')) {
      gates.push(
        gate(`subfolder-readme:${sub}`, existsSync(join(dir, 'README.md')), `docs/business/${sub}/README.md`),
      );
    }
    for (const file of def?.canonicalFiles ?? []) {
      if (file.includes('*')) continue;
      gates.push(
        gate(`canonical:${sub}/${file}`, existsSync(join(dir, file)), `docs/business/${sub}/${file}`),
      );
    }
  }

  for (const sub of optionalSubs) {
    const def = spec.requiredSubfolders?.[sub];
    if (!def?.sourcePatterns?.length) continue;
    for (const pattern of def.sourcePatterns) {
      if (!pattern.startsWith('docs/_archive/')) continue;
      if (!hasNarrativeInReference(REPO, pattern)) continue;
      const targetDir = join(businessDir, sub);
      const decomposed =
        existsSync(targetDir) &&
        readdirSync(targetDir, { withFileTypes: true }).some(
          (e) => e.isFile() && e.name.endsWith('.md') && !DECOMPOSE_EXEMPT_FILES.has(e.name),
        );
      gates.push(
        gate(
          `decompose:${pattern}`,
          decomposed,
          decomposed ? `relocated to docs/business/${sub}/` : `narrative still in ${pattern}`,
        ),
      );
    }
  }

  for (const [refPath] of Object.entries(spec.crossReference?.referenceDecompose ?? {})) {
    if (!refPath.startsWith('docs/_archive/') && !refPath.startsWith('docs/overview/')) continue;
    if (!hasNarrativeInReference(REPO, refPath)) continue;
    gates.push(
      gate(
        `decompose:${refPath}`,
        false,
        `reference/overview product narrative must decompose — still present at ${refPath}`,
      ),
    );
  }

  if (businessExists) {
    const loose = readdirSync(businessDir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md') && !['README.md', 'FOLDER-SPEC.md', 'scorecard.md'].includes(e.name))
      .map((e) => e.name);
    gates.push(
      gate(
        'no-loose-research-at-root',
        loose.length === 0,
        loose.length ? `move to research/: ${loose.join(', ')}` : 'ok',
      ),
    );
    gates.push(gate('research-folder', existsSync(join(businessDir, 'research')), 'docs/business/research/'));
  }

  emit(gates, repoName, resolution, profileKey);
}

function emit(gates, repoName, resolution, profileKey = null) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-business-check/v2',
    repo: repoName,
    profile: profileKey,
    at: new Date().toISOString(),
    ok,
    spec: {
      localPath: resolution?.localPath ?? null,
      localIsStub: resolution?.localIsStub ?? null,
      upstreamPath: resolution?.upstreamPath ?? null,
      resolvedIsFull: resolution?.resolvedIsFull ?? false,
    },
    gates,
  };

  if (WRITE) {
    mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
  }

  console.log('=== docs:business:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  if (WRITE) console.log(`witness: ${WITNESS}`);
  process.exit(ok ? 0 : 1);
}

main();
