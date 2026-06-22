#!/usr/bin/env node
/**
 * docs:pack:pillar-contract:check — all docs layer packs must declare 11-pillar contract + fractalMpr
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';
import {
  PACKS_WITH_CONTRACT,
  checkFractalMprBlock,
  checkPillarContractComplete,
  gate,
  loadPack,
} from './lib/docs-fractal-mpr-gates.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);

function main() {
  const gates = [];
  gates.push(
    gate(
      'policy:docs-fractal-mpr',
      existsSync(join(REPO, 'machine/spec/docs-fractal-mpr-policy.json')),
      'machine/spec/docs-fractal-mpr-policy.json',
    ),
  );

  for (const packFile of PACKS_WITH_CONTRACT) {
    const spec = loadPack(REPO, `machine/spec/${packFile}`);
    const prefix = `pack:${packFile.replace('.json', '')}`;
    if (!spec) {
      gates.push(gate(`${prefix}:present`, false, 'pack missing'));
      continue;
    }
    gates.push(gate(`${prefix}:present`, true, packFile));
    checkPillarContractComplete(spec, prefix, gates);
    checkFractalMprBlock(spec, prefix, gates);
  }

  const pass = gates.filter((g) => g.ok).length;
  const fail = gates.length - pass;
  console.log('\n=== docs:pack:pillar-contract:check ===\n');
  for (const g of gates) {
    console.log(`${g.ok ? 'OK' : 'FAIL'} ${g.id}${g.detail ? ` — ${g.detail}` : ''}`);
  }
  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass}/${gates.length}\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
