#!/usr/bin/env node
/**
 * docs:foundation:check — strict docs/foundation/ pack per resolved docs-foundation-pack.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './lib/resolve-docs-pack.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-foundation-latest.json');
const PACK = 'docs-foundation-pack.json';
const CANON_SYNTH = join(REPO, '../canon-os/platform/scripts/synthesize-product-canon.mjs');

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function main() {
  const gates = [];
  const resolution = resolveDocsPack(REPO, PACK);
  const spec = resolution.resolved;
  const repoName = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;

  gates.push(
    gate('spec:local-present', !!resolution.localPath || existsSync(join(REPO, '../canon-os/pm/spec', PACK)), resolution.localPath ?? 'missing local pack'),
  );
  gates.push(
    gate(
      'spec:not-stub',
      !resolution.localIsStub,
      resolution.localIsStub ? 'run pnpm docs:fleet:foundation:upgrade --write' : 'full local pack',
    ),
  );
  gates.push(
    gate(
      'spec:resolved-full',
      resolution.resolvedIsFull,
      resolution.resolvedIsFull ? 'resolved full foundation pack' : 'could not resolve requiredFiles + profiles',
    ),
  );

  if (!spec || !resolution.resolvedIsFull) {
    emit(gates, repoName, resolution);
    return;
  }

  gates.push(gate('profile', !!spec.profiles, profileKeyFromTier(readProductTier(REPO))));

  for (const entry of spec.requiredFiles ?? []) {
    const rel = entry.path.replace(/^docs\//, '');
    gates.push(gate(`file:${rel}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const readmePath = join(REPO, 'docs/foundation/README.md');
  if (existsSync(readmePath)) {
    const text = readFileSync(readmePath, 'utf8');
    gates.push(gate('readme:index', /freshness|read order|session/i.test(text), 'README index or freshness table'));
    gates.push(
      gate('readme:business-link', /business/i.test(text), 'README links to docs/business/ for detail layer'),
    );
  }

  const constitutionPath = join(REPO, 'docs/foundation/constitution.md');
  const fleetPath = spec.fleetConstitution?.path;
  if (existsSync(constitutionPath) && fleetPath) {
    const text = readFileSync(constitutionPath, 'utf8');
    const fleetRel = fleetPath.replace(/^docs\//, '');
    gates.push(
      gate(
        'constitution:fleet-link',
        text.includes('GTCX-CONSTITUTION') || text.includes(fleetRel) || text.includes('canon-os'),
        'constitution.md → fleet constitution',
      ),
    );
  }

  if (profileKeyFromTier(readProductTier(REPO)) === 'constitution-standards' && existsSync(fleetPath)) {
    gates.push(gate('fleet-constitution', existsSync(join(REPO, fleetPath)), fleetPath));
  }

  if (existsSync(join(REPO, 'docs/foundation/vision.md')) || existsSync(join(REPO, 'docs/canon'))) {
    const synthScript = existsSync(CANON_SYNTH)
      ? CANON_SYNTH
      : join(REPO, 'platform/scripts/synthesize-product-canon.mjs');
    if (existsSync(synthScript)) {
      const result = spawnSync('node', [synthScript, '--check'], {
        cwd: REPO,
        encoding: 'utf8',
      });
      gates.push(
        gate(
          'canon:synthesize:check',
          result.status === 0,
          result.status === 0 ? 'docs → machine/canon fresh' : 'run pnpm canon:synthesize',
        ),
      );
    } else {
      gates.push(
        gate(
          'canon:strategy-present',
          existsSync(join(REPO, 'machine/canon/strategy.json')),
          'machine/canon/strategy.json from canon:synthesize',
        ),
      );
    }
  }

  emit(gates, repoName, resolution);
}

function emit(gates, repoName, resolution) {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-foundation-check/v2',
    repo: repoName,
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

  console.log('=== docs:foundation:check ===\n');
  for (const g of gates) console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${gates.filter((g) => g.ok).length}/${gates.length}`);
  if (WRITE) console.log(`witness: ${WITNESS}`);
  process.exit(ok ? 0 : 1);
}

main();
