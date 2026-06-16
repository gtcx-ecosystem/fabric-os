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
      resolution.localPath ?? 'missing pm/spec/docs-roadmap-pack.json',
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

  const roadmapDir = join(REPO, 'docs/roadmap');
  const roadmapExists = existsSync(roadmapDir);

  if (!profile?.roadmapRequired && !roadmapExists) {
    gates.push(gate('roadmap-optional-skip', true, `${profileKey} — roadmap not required`));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  if (profileKey === 'constitution-standards') {
    // Hub: pointer discipline only — do not require lane scaffolds.
    gates.push(gate('hub:readme', existsSync(join(roadmapDir, 'README.md')), 'docs/roadmap/README.md'));
    emit(gates, repoName, resolution, profileKey);
    return;
  }

  for (const entry of spec.requiredRootFiles ?? []) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  for (const [sub, def] of Object.entries(spec.requiredSubfolders ?? {})) {
    if (def?.optional) continue;
    const dir = join(roadmapDir, sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `docs/roadmap/${sub}/`));
    for (const f of def?.required ?? []) {
      gates.push(gate(`subfolder-file:${sub}/${f}`, existsSync(join(dir, f)), `docs/roadmap/${sub}/${f}`));
    }
  }

  for (const rel of ['docs/strategy', 'docs/overview', 'docs/product', 'docs/architecture']) {
    gates.push(
      gate(
        `no-roadmap-outside:${rel}`,
        !hasRoadmapNarrativeAt(REPO, rel),
        `no roadmap narrative under ${rel}/ (must live under docs/roadmap/)`,
      ),
    );
  }

  const foundationRoadmap = join(REPO, 'docs/foundation/roadmap.md');
  if (existsSync(foundationRoadmap)) {
    const text = readFileSync(foundationRoadmap, 'utf8');
    const isPointer =
      /status:\s*pointer/i.test(text) ||
      /docs\/roadmap\/roadmap-current\.md/i.test(text) ||
      /\*\*Canonical SoR:\*\*/.test(text);
    gates.push(
      gate(
        'foundation:roadmap-pointer',
        isPointer,
        'docs/foundation/roadmap.md must pointer-only → docs/roadmap/roadmap-current.md',
      ),
    );
  }

  emit(gates, repoName, resolution, profileKey);
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

