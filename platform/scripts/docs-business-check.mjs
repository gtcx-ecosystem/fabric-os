#!/usr/bin/env node
/**
 * docs:business:check — verify docs/business/ pack per pm/spec/docs-business-pack.json
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SPEC = join(REPO, 'pm/spec/docs-business-pack.json');
const CANON_SPEC = join(REPO, '../canon-os/pm/spec/docs-business-pack.json');
const WRITE = process.argv.includes('--write');
const WITNESS = join(REPO, 'audit/evidence/docs-business-latest.json');

function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

function loadSpec() {
  if (existsSync(SPEC)) return JSON.parse(readFileSync(SPEC, 'utf8'));
  if (existsSync(CANON_SPEC)) return JSON.parse(readFileSync(CANON_SPEC, 'utf8'));
  return null;
}

function main() {
  const gates = [];
  const spec = loadSpec();
  gates.push(gate('spec', !!spec, existsSync(SPEC) ? 'pm/spec/docs-business-pack.json' : 'canon-os upstream'));

  if (!spec) {
    emit(gates);
    return;
  }

  const goalsPath = join(REPO, 'pm/spec/product-goals.json');
  const tier = existsSync(goalsPath) ? JSON.parse(readFileSync(goalsPath, 'utf8')).tier : null;
  const profileKey =
    tier === 'fleet-documentation'
      ? 'fleet-documentation'
      : tier === 'canon-service' || tier === 'program-office'
        ? 'constitution-standards'
        : tier === 'platform' || tier === 'fleet-agile' || tier === 'monorepo-root'
          ? 'platform'
          : 'product';
  const profile = spec.profiles?.[profileKey] ?? spec.profiles?.product;

  if (!profile?.businessRequired && !existsSync(join(REPO, 'docs/business'))) {
    gates.push(gate('business-optional-skip', true, `${profileKey} — business not required`));
    emit(gates, JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name);
    return;
  }

  for (const entry of spec.requiredRootFiles ?? []) {
    gates.push(gate(`root:${entry.path}`, existsSync(join(REPO, entry.path)), entry.path));
  }

  const repoName = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;

  const requiredSubs = profile?.requiredSubfolders ?? [];
  for (const sub of requiredSubs) {
    const def = spec.requiredSubfolders?.[sub];
    const dir = join(REPO, 'docs/business', sub);
    gates.push(gate(`subfolder:${sub}`, existsSync(dir), `docs/business/${sub}/`));
    if (def?.required?.includes('README.md')) {
      gates.push(gate(`subfolder-readme:${sub}`, existsSync(join(dir, 'README.md')), `docs/business/${sub}/README.md`));
    }
  }

  const researchDir = join(REPO, 'docs/business/research');
  if (existsSync(join(REPO, 'docs/business'))) {
    const loose = readdirSync(join(REPO, 'docs/business'), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md') && !['README.md', 'FOLDER-SPEC.md'].includes(e.name))
      .map((e) => e.name);
    gates.push(
      gate(
        'no-loose-research-at-root',
        loose.length === 0,
        loose.length ? `move to research/: ${loose.join(', ')}` : 'ok',
      ),
    );
    gates.push(gate('research-folder', existsSync(researchDir), 'docs/business/research/'));
  }

  emit(gates, repoName);
}

function emit(gates, repoName = 'unknown') {
  const ok = gates.every((g) => g.ok);
  const witness = {
    schema: 'gtcx://canon-os/docs-business-check/v1',
    repo: repoName,
    at: new Date().toISOString(),
    ok,
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
