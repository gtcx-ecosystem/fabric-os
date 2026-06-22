#!/usr/bin/env node
/**
 * P58 gtm:readiness:check — per-repo GTM product-readiness conformance
 * @see machine/spec/gtm-product-readiness-standard.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGtmReadiness } from './lib/evaluate-gtm-readiness.mjs';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');

const result = evaluateGtmReadiness(REPO, { write: WRITE });

console.log('\n=== gtm:readiness:check ===\n');
console.log(`repo: ${result.repo} · profile: ${result.profile} · composite: ${result.composite}\n`);
for (const d of result.dimensions) {
  console.log(`${d.pass ? 'OK' : 'FAIL'} ${d.id} — ${d.score}%`);
}
console.log(`\n${result.ok ? 'PASS' : 'FAIL'} — ${result.dimensions.filter((d) => d.pass).length}/${result.dimensions.length}\n`);

if (WRITE) {
  const witness = join(REPO, 'machine/ci/gtm-readiness-check-latest.json');
  mkdirSync(join(REPO, 'machine/ci'), { recursive: true });
  writeFileSync(
    witness,
    `${JSON.stringify(
      {
        schema: 'gtcx://canon-os/gtm-readiness-check/v1',
        generatedAt: new Date().toISOString(),
        ...result,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`witness: ${witness}`);
  console.log('reports: audit/evidence/gtm-{progress,status,goal}-report-latest.json');
}

process.exit(result.ok ? 0 : 1);
