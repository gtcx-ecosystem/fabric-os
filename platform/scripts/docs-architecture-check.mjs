#!/usr/bin/env node
/**
 * docs:architecture:check — strict docs/architecture/ pack per resolved docs-architecture-pack.json
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hasNarrativeInPath, looseMarkdownAtRoot } from './lib/docs-decompose-gates.mjs';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-architecture-latest.json');
const PACK = 'docs-architecture-pack.json';

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function isPointerMarkdown(text) {
  return /status:\s*pointer/i.test(text) || /\*\*Canonical SoR:\*\*/.test(text);
}

function countNarrativeSpecFiles(specsDir, exempt = new Set(['README.md', 'index.md', 'FOLDER-SPEC.md'])) {
  if (!existsSync(specsDir)) return 0;
  let count = 0;
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p);
        continue;
      }
      if (!ent.name.endsWith('.md') || exempt.has(ent.name)) continue;
      const text = readFileSync(p, 'utf8');
      if (isPointerMarkdown(text)) continue;
      count += 1;
    }
  };
  walk(specsDir);
  return count;
}

function applyContentBarGates(gates, archDir, contentBar) {
  if (!contentBar) return;

  if (contentBar.minAdrFiles > 0) {
    const decisionsDir = join(archDir, 'decisions');
    const adrs =
      existsSync(decisionsDir)
        ? readdirSync(decisionsDir).filter((n) => /^ADR-\d+/i.test(n) && n.endsWith('.md'))
        : [];
    gates.push(
      gate(
        'content:adr-min',
        adrs.length >= contentBar.minAdrFiles,
        `ADR count ${adrs.length}/${contentBar.minAdrFiles}`,
      ),
    );
  }

  for (const nest of contentBar.specNests ?? []) {
    gates.push(
      gate(
        `content:spec-nest:${nest}`,
        existsSync(join(archDir, 'specs', nest, 'README.md')),
        `docs/architecture/specs/${nest}/README.md`,
      ),
    );
  }

  if (contentBar.minNarrativeSpecFiles > 0) {
    const count = countNarrativeSpecFiles(join(archDir, 'specs'));
    gates.push(
      gate(
        'content:spec-narrative-min',
        count >= contentBar.minNarrativeSpecFiles,
        `${count} narrative spec files (min ${contentBar.minNarrativeSpecFiles})`,
      ),
    );
  }
}

function main() {
  const gates = [];
  const resolution = resolveDocsPack(REPO, PACK);
  const spec = resolution.resolved;
  const repoName = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;
  const tier = readProductTier(REPO);
  const profileKey = profileKeyFromTier(tier);
  const profile = spec?.profiles?.[profileKey] ?? spec?.profiles?.product;

  gates.push(
    gate('spec:local-present', !!resolution.localPath || existsSync(join(REPO, '../canon-os/pm/spec', PACK)), resolution.localPath ?? 'missing pm/spec/docs-architecture-pack.json'),
  );
  gates.push(
    gate(
      'spec:not-stub',
      !resolution.localIsStub,
      resolution.localIsStub ? 'run pnpm docs:fleet:architecture:upgrade --write' : 'full local pack',
    ),
  );
  gates.push(
    gate(
      'spec:resolved-full',
      resolution.resolvedIsFull,
      resolution.resolvedIsFull ? 'resolved full architecture pack' : 'could not resolve profiles + requiredSubfolders',
    ),
  );

  if (!spec || !resolution.resolvedIsFull) {
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  gates.push(gate('profile', !!profile, profileKey));

  if (!profile?.architectureRequired) {
    gates.push(gate('architecture-optional-skip', true, `${profileKey} — architecture optional`));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  const archDir = join(REPO, 'docs/architecture');

  for (const entry of spec.requiredRootFiles ?? []) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const rootReadme = join(archDir, 'README.md');
  if (existsSync(rootReadme)) {
    const text = readFileSync(rootReadme, 'utf8');
    gates.push(gate('root-readme:cross-ref', /cross-ref/i.test(text) && /foundation/i.test(text), 'README cross-ref table'));
    gates.push(gate('root-readme:business-link', /business/i.test(text), 'README links business layer'));
  }

  const folderSpec = join(archDir, 'FOLDER-SPEC.md');
  if (existsSync(folderSpec)) {
    gates.push(gate('root-folder-spec:pack-link', /docs-architecture-pack/i.test(readFileSync(folderSpec, 'utf8')), 'FOLDER-SPEC cites pack'));
  }

  const requiredSubs = profile?.requiredSubfolders ?? [];
  const optionalSubs = profile?.optionalSubfolders ?? [];

  for (const sub of requiredSubs) {
    const def = spec.requiredSubfolders?.[sub];
    const dir = join(archDir, sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `docs/architecture/${sub}/`));
    for (const req of def?.required ?? ['README.md']) {
      gates.push(gate(`subfolder-file:${sub}/${req}`, existsSync(join(dir, req)), `docs/architecture/${sub}/${req}`));
    }
  }

  for (const sub of optionalSubs) {
    const def = spec.requiredSubfolders?.[sub];
    if (!def?.sourcePatterns?.length) continue;
    for (const pattern of def.sourcePatterns) {
      if (!pattern.startsWith('docs/_archive/')) continue;
      if (!hasNarrativeInPath(REPO, pattern)) continue;
      const targetDir = join(archDir, sub);
      const hasTarget =
        existsSync(targetDir) &&
        readdirSync(targetDir).some((n) => n.endsWith('.md') && n !== 'README.md');
      gates.push(
        gate(`decompose:${pattern}`, hasTarget, hasTarget ? `relocated to docs/architecture/${sub}/` : `narrative still in ${pattern}`),
      );
    }
  }

  for (const [refPath] of Object.entries(spec.crossReference?.referenceDecompose ?? {})) {
    if (!refPath.startsWith('docs/_archive/specs')) continue;
    if (!hasNarrativeInPath(REPO, refPath)) continue;
    gates.push(gate(`decompose:${refPath}`, false, `reference specs must decompose to docs/architecture/specs/`));
  }

  if (existsSync(archDir)) {
    const loose = looseMarkdownAtRoot(archDir);
    gates.push(
      gate('no-loose-narrative-at-root', loose.length === 0, loose.length ? `relocate: ${loose.join(', ')}` : 'ok'),
    );
    const adrRoot = readdirSync(archDir).filter((n) => /^ADR-/i.test(n) && n.endsWith('.md'));
    gates.push(
      gate('no-adr-at-root', adrRoot.length === 0, adrRoot.length ? `move to decisions/: ${adrRoot.join(', ')}` : 'ok'),
    );
    applyContentBarGates(gates, archDir, spec.contentBar?.[profileKey] ?? spec.contentBar?.product);
  }

  emit(gates, repoName, resolution, profileKey);
}

function emit(gates, repoName, resolution, profileKey) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-architecture-check/v2',
    repo: repoName,
    profile: profileKey,
    at: new Date().toISOString(),
    ok,
    spec: {
      localPath: resolution?.localPath ?? null,
      localIsStub: resolution?.localIsStub ?? null,
      resolvedIsFull: resolution?.resolvedIsFull ?? false,
    },
    gates,
  };

  if (WRITE) {
    mkdirSync(join(REPO, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
  }

  console.log('=== docs:architecture:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  if (WRITE) console.log(`witness: ${WITNESS}`);
  process.exit(ok ? 0 : 1);
}

main();
