#!/usr/bin/env node
/**
 * docs:product:check — strict docs/product/ pack per resolved docs-product-pack.json
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hasNarrativeInPath } from './lib/docs-decompose-gates.mjs';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-product-latest.json');
const PACK = 'docs-product-pack.json';
const DECOMPOSE_EXEMPT_FILES = new Set(['README.md', 'FOLDER-SPEC.md', 'index.md']);

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
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
      resolution.localPath ?? 'missing pm/spec/docs-product-pack.json',
    ),
  );
  gates.push(
    gate(
      'spec:not-stub',
      !resolution.localIsStub,
      resolution.localIsStub ? 'run pnpm docs:fleet:product:upgrade --write' : 'full local pack',
    ),
  );
  gates.push(
    gate(
      'spec:resolved-full',
      resolution.resolvedIsFull,
      resolution.resolvedIsFull ? 'resolved full product pack' : 'could not resolve profiles + requiredSubfolders',
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

  const productDir = join(REPO, 'docs/product');
  const productExists = existsSync(productDir);

  if (!profile?.productRequired && !productExists) {
    gates.push(gate('product-optional-skip', true, `${profileKey} — product not required`));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  if (profileKey === 'constitution-standards') {
    gates.push(gate('hub:readme', existsSync(join(productDir, 'README.md')), 'docs/product/README.md'));
    if (existsSync(join(productDir, 'README.md'))) {
      const readme = readFileSync(join(productDir, 'README.md'), 'utf8');
      gates.push(
        gate(
          'hub:fleet-pointer',
          /ecosystem-os|product repos|fleet product/i.test(readme),
          'constitution-standards README must point to fleet product UX SoR',
        ),
      );
    }
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  if (profileKey === 'platform' && !profile?.productRequired && !productExists) {
    gates.push(gate('product-optional-skip', true, 'platform — product optional'));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  for (const entry of spec.requiredRootFiles ?? []) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const rootReadme = join(productDir, 'README.md');
  if (existsSync(rootReadme)) {
    const text = readFileSync(rootReadme, 'utf8');
    gates.push(
      gate(
        'root-readme:cross-ref',
        /cross-ref/i.test(text) && /foundation/i.test(text),
        'README must link foundation ↔ product (cross-ref table)',
      ),
    );
  }

  const folderSpec = join(productDir, 'FOLDER-SPEC.md');
  if (existsSync(folderSpec)) {
    const text = readFileSync(folderSpec, 'utf8');
    gates.push(
      gate(
        'root-folder-spec:pack-link',
        /docs-product-pack/i.test(text),
        'FOLDER-SPEC must cite docs-product-pack.json',
      ),
    );
  }

  const requiredSubs = profile?.requiredSubfolders ?? [];
  const optionalSubs = profile?.optionalSubfolders ?? [];

  for (const sub of requiredSubs) {
    const def = spec.requiredSubfolders?.[sub];
    const dir = join(productDir, sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `docs/product/${sub}/`));
    if (def?.required?.includes('README.md')) {
      gates.push(
        gate(`subfolder-readme:${sub}`, existsSync(join(dir, 'README.md')), `docs/product/${sub}/README.md`),
      );
    }
    for (const file of def?.canonicalFiles ?? []) {
      if (file.includes('*')) continue;
      gates.push(
        gate(`canonical:${sub}/${file}`, existsSync(join(dir, file)), `docs/product/${sub}/${file}`),
      );
    }
  }

  for (const sub of [...requiredSubs, ...optionalSubs]) {
    const def = spec.requiredSubfolders?.[sub];
    if (!def?.sourcePatterns?.length) continue;
    for (const pattern of def.sourcePatterns) {
      if (
        !pattern.startsWith('docs/_archive/') &&
        !pattern.startsWith('docs/architecture/')
      ) {
        continue;
      }
      if (!hasNarrativeInPath(REPO, pattern)) continue;
      const targetDir = join(productDir, sub);
      const decomposed =
        existsSync(targetDir) &&
        readdirSync(targetDir, { withFileTypes: true }).some(
          (e) => e.isFile() && e.name.endsWith('.md') && !DECOMPOSE_EXEMPT_FILES.has(e.name),
        );
      gates.push(
        gate(
          `decompose:${pattern}`,
          decomposed,
          decomposed ? `relocated to docs/product/${sub}/` : `narrative still in ${pattern}`,
        ),
      );
    }
  }

  if (productExists) {
    const loose = readdirSync(productDir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md') && !['README.md', 'FOLDER-SPEC.md'].includes(e.name))
      .map((e) => e.name);
    gates.push(
      gate(
        'no-loose-narrative-at-root',
        loose.length === 0,
        loose.length ? `move under ux/ or subfolder: ${loose.join(', ')}` : 'ok',
      ),
    );
  }

  emit(gates, repoName, resolution, profileKey);
}

function emit(gates, repoName, resolution, profileKey = null) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-product-check/v1',
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

  console.log('=== docs:product:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  if (WRITE) console.log(`witness: ${WITNESS}`);
  process.exit(ok ? 0 : 1);
}

main();
