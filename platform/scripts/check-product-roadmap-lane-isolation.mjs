#!/usr/bin/env node
/**
 * Product roadmap lane isolation — fabric-os owner check.
 * SoR: canon-os/pm/spec/product-roadmap-lane-isolation-protocol.json
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CANON = join(ROOT, '..', 'canon-os');
const BRIDGE_LIB = join(ROOT, '..', 'bridge-os', 'platform/scripts/lib/check-product-roadmap-lane-isolation.mjs');
const WRITE = process.argv.includes('--write');
const OUT = join(ROOT, 'audit/evidence/product-roadmap-lane-isolation-latest.json');

const require = createRequire(import.meta.url);
let checkProductRoadmapLaneIsolation;

if (existsSync(BRIDGE_LIB)) {
  ({ checkProductRoadmapLaneIsolation } = await import(BRIDGE_LIB));
} else {
  console.error('FAIL bridge lane isolation lib missing');
  process.exit(1);
}

const result = checkProductRoadmapLaneIsolation(ROOT, CANON);

console.log('=== product-roadmap:lane:check ===\n');
console.log(`${result.ok ? 'PASS' : 'FAIL'} fabric-os`);
for (const e of result.errors ?? []) {
  console.log(`  · ${e.file ?? e.story ?? e.gate ?? ''} ${e.detail ?? e.pattern ?? ''}`);
}
for (const w of result.warnings ?? []) {
  console.log(`  warn: ${w.detail ?? ''}`);
}

const witness = {
  schema: 'gtcx://fabric-os/product-roadmap-lane-isolation/v1',
  checkedAt: new Date().toISOString(),
  repo: 'fabric-os',
  ok: result.ok,
  errors: result.errors ?? [],
  warnings: result.warnings ?? [],
  productLanesChecked: result.productLanesChecked,
  executionFilesChecked: result.executionFilesChecked,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  console.log(`\nwitness: audit/evidence/product-roadmap-lane-isolation-latest.json`);
}

process.exit(result.ok ? 0 : 1);
