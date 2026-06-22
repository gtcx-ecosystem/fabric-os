#!/usr/bin/env node
/**
 * docs:roadmap:check — strict docs/roadmap/ pack per resolved docs-roadmap-pack.json
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-roadmap-latest.json');
const PACK = 'docs-roadmap-pack.json';

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function hasRoadmapNarrativeAt(repoRoot, relDir) {
  const p = join(repoRoot, relDir);
  if (!existsSync(p)) return false;
  const walk = (d) => {
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      const fp = join(d, ent.name);
      if (ent.isDirectory()) {
        if (walk(fp)) return true;
        continue;
      }
      if (!ent.name.endsWith('.md')) continue;

      // Enforce: any roadmap-named markdown outside docs/roadmap is forbidden,
      // unless it is explicitly pointer-only (status: pointer).
      if (!/roadmap/i.test(ent.name)) continue;

      const text = readFileSync(fp, 'utf8');
      const isPointer =
        /status:\s*pointer/i.test(text) ||
        /\*\*Canonical SoR:\*\*/.test(text);

      if (!isPointer) return true;
    }
    return false;
  };
  return walk(p);
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
      resolution.localPath ?? 'missing machine/spec/docs-roadmap-pack.json',
    ),
  );
  gates.push(
    gate(
      'spec:not-stub',
      !resolution.localIsStub,
      resolution.localIsStub ? 'local pack is upstream pointer only — upgrade to full pack' : 'full local pack',
    ),
  );
  gates.push(
    gate(
      'spec:resolved-full',
      resolution.resolvedIsFull,
      resolution.resolvedIsFull ? 'resolved full roadmap pack' : 'could not resolve requiredSubfolders',
    ),
  );

  if (!spec || !resolution.resolvedIsFull) {
    emit(gates, repoName, resolution);
    return;
  }

  const tier = readProductTier(REPO);
  const profileKey = profileKeyFromTier(tier);
  const profile = spec?.profiles?.[profileKey] ?? spec?.profiles?.product;
  gates.push(gate('profile', !!profile, profileKey));

  const canonicalPath = spec.canonicalPath ?? 'agile/roadmaps';
  const roadmapDir = join(REPO, canonicalPath);
  const roadmapExists = existsSync(roadmapDir);
  const legacyRoadmapDir = join(REPO, 'docs/roadmap');

  if (!profile?.roadmapRequired && !roadmapExists && !existsSync(legacyRoadmapDir)) {
    gates.push(gate('roadmap-optional-skip', true, `${profileKey} — roadmap not required`));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  if (profileKey === 'constitution-standards') {
    gates.push(gate('hub:readme', existsSync(join(roadmapDir, 'README.md')) || isLegacyPointerOnly(legacyRoadmapDir), 'agile/roadmaps or pointer'));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  gates.push(gate(`canonical:${canonicalPath}`, existsSync(roadmapDir), canonicalPath));
  gates.push(gate(`canonical-readme:${canonicalPath}/README.md`, existsSync(join(roadmapDir, 'README.md')), `${canonicalPath}/README.md`));

  for (const file of spec.canonicalLaneFiles ?? ['technical.md', 'gtm.md']) {
    gates.push(gate(`lane:${file}`, existsSync(join(roadmapDir, file)), `${canonicalPath}/${file}`));
  }

  if (existsSync(legacyRoadmapDir)) {
    gates.push(
      gate(
        'legacy:docs-roadmap-pointer',
        isLegacyPointerOnly(legacyRoadmapDir),
        'docs/roadmap/ must be pointer-only → agile/roadmaps/',
      ),
    );
  }

  for (const rel of ['docs/strategy', 'docs/overview', 'docs/product', 'docs/architecture']) {
    gates.push(
      gate(
        `no-roadmap-outside:${rel}`,
        !hasRoadmapNarrativeAt(REPO, rel),
        `no roadmap narrative under ${rel}/ (lanes → ${canonicalPath}/)`,
      ),
    );
  }

  const foundationRoadmap = join(REPO, 'docs/foundation/roadmap.md');
  if (existsSync(foundationRoadmap)) {
    const text = readFileSync(foundationRoadmap, 'utf8');
    const isPointer =
      /status:\s*pointer/i.test(text) ||
      /agile\/roadmaps/i.test(text) ||
      /\*\*Canonical SoR:\*\*/.test(text);
    gates.push(
      gate(
        'foundation:roadmap-pointer',
        isPointer,
        'docs/foundation/roadmap.md must link executive lens → agile/roadmaps/',
      ),
    );
  }

  emit(gates, repoName, resolution, profileKey);
}

function isLegacyPointerOnly(dir) {
  if (!existsSync(dir)) return true;
  const readme = join(dir, 'README.md');
  if (!existsSync(readme)) return false;
  const text = readFileSync(readme, 'utf8');
  return /status:\s*pointer/i.test(text) || /agile\/roadmaps/i.test(text) || /\*\*Canonical SoR:\*\*/.test(text);
}

function emit(gates, repoName, resolution, profileKey = null) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-roadmap-check/v1',
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

  console.log('=== docs:roadmap:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  if (WRITE) console.log(`witness: ${WITNESS}`);
  process.exit(ok ? 0 : 1);
}

main();

